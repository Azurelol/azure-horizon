import { EvaluationContext, SourceInfo } from "../data/common/_module.mjs";

import AH from "../config.mjs";
import {
  ActionConfig,
  ChatAction,
  ChatMessageBuilder,
  ChatMessageHelper,
  ChatMessageSections,
  ChatSectionOrder,
  FlagBuilder,
} from "../helpers/_module.mjs";
import Flags from "../data/common/flags.mjs";
import { assertCondition, systemID, systemTemplatePath } from "../constants.mjs";
import DamageData from "./damage-data.mjs";
import Events from "./events.mjs";
import { StringUtils, TokenUtils } from "../utils/_module.mjs";
import { DamageRequest } from "./_module.mjs";
import PipelineContext from "./pipeline-context.mjs";
import { Formulas } from "../ruleset/_module.mjs";
import Expressions from "./expressions.mjs";
import Pressure from "./pressure.mjs";

/**
 * @property {DamageData} damageData
 * @property {String} message
 * @property {DamageInstance[]} instances Combined from the input damage data.
 * @property {DamageResolution} result Calculated during processing.
 * @property {Record<AH_DamageType, ParameterModifier>} modifiers Gathered during processing.
 * @property {PressureData} pressure
 */
class DamageContext extends PipelineContext {
  constructor(request, actor) {
    super(request, actor);
    this.modifiers = {};
  }
}

/**
 * @param {DamageContext} context
 * @return {Promise<Boolean>|void}
 */
async function collectModifiers(context) {

  // Only collect modifiers for heroes/adversaries
  if (!context.subject.isCharacterType) {
    return;
  }

  /** @type CharacterParametersDataModel **/
  const incoming = context.subject.system.parameters;
  for (const type of context.damageData.types) {
    const mods = incoming.damage.resolve(type, "incoming");
    for (const mod of mods) {
      context.damageData.modify(type, mod);
    }
  }
}

/**
 * @param {DamageContext} context
 * @return {Boolean}
 */
function calculateResult(context) {

  const resolved = context.damageData.resolved;
  if (resolved.total === undefined) {
    throw Error("Failed to calculate the damage result.");
  }

  /** @type PressureData **/
  let pressure = {
    affinities: [],
    trait: false,
  };
  const modifiers = context.subject.system.parameters.damage.modifiers;
  for (const inst of resolved.instances) {
    const key = `${inst.type}.incoming`;
    /** @type ModifierEntry **/
    const mod = modifiers.find(m => m.key === key);
    if (mod) {
      if ((mod.additive > 0) || (mod.multiplicative > 1)) {
        pressure.affinities.push(inst.type);
      }
    }
  }
  if (context.traits.has("pressure")) {
    pressure.trait = true;
  }
  pressure.valid = pressure.trait || (pressure.affinities.length > 0);
  if (pressure.valid) {
    let components = [...pressure.affinities];
    if (pressure.trait) {
      components = ["trait"];
    }
    pressure.message = components.join(", ");
  }

  context.pressure = pressure;
  context.result = resolved;
  context.message = "AH.CHAT.ApplyDamage";
}

/**
 * @param {DamageRequest} request
 * @return {Promise<Awaited<unknown>[]>}
 */
async function process(request) {
  if (!request.validate()) {
    return Promise.reject("Request was not valid");
  }

  const updates = [];
  for (const subject of request.targets) {
    if (!subject.isOwner) {
      ui.notifications.warn("AH.DIALOG.WARNINGS.DocumentOwnership", { localize: true });
      continue;
    }

    let context = new DamageContext(request, subject);
    await collectModifiers(context);
    calculateResult(context);
    if (context.result === undefined) {
      throw new Error("Failed to generate result during pipeline");
    }
    // TODO: Apply damage, etc...

    let resource = "hp";
    let color = "red";
    let damageTaken = context.result.total;
    /** @type ActorResourceDataModel **/
    const resourceField = subject.system.resources[resource];

    let amountBlocked = undefined;
    let remainingBlock = undefined;

    if (resource === "hp") {
      if (resourceField.temporary > 0) {
        remainingBlock = resourceField.temporary - damageTaken;
        if (remainingBlock < 0) {
          // Damage ate through all the block, reduce it and keep going
          damageTaken = Math.abs(remainingBlock);
          amountBlocked = resourceField.temporary;
          remainingBlock = 0;
        } else {
          // Damage was absorbed fully by block
          damageTaken = 0;
          amountBlocked = resourceField.temporary - remainingBlock;
        }
      }
    }

    const difference = resourceField.value - damageTaken;
    if (difference < 0) {
      damageTaken -= Math.abs(difference);
    }

    // If no damage was dealt or absorbed, exit early
    if (damageTaken === 0) {
      if (amountBlocked !== undefined) {
        updates.push(subject.update({ [`system.resources.${resource}.temporary`]: remainingBlock }).then(async (result) => {
          ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ subject }),
            content: StringUtils.localize("AH.CHAT.DamageFullBlock", {
              actor: subject.name,
              from: request.sourceInfo.name,
              amount: amountBlocked,
            }),
          });
        }));
      }
      else {
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ subject }),
          content: StringUtils.localize("AH.DIALOG.WARNING.ApplyNoDamage", {
            actor: subject.name,
            from: request.sourceInfo.name,
          }),
        });
      }
      continue;
    }

    let pressure;
    if (context.pressure.valid) {
      pressure = await Pressure.process(context);
    }

    // Create the update
    updates.push(
      subject.modifyTokenAttribute(`resources.${resource}`, -damageTaken, true).then(async (result) => {

        // If the target was pressured (elites/solos)
        let content = [];

        /** @type ChatMessageBuilderData **/
        let renderData = {
          tags: [],
          sections: [],
          postRenderActions: [],
          flags: [],
        };

        if (amountBlocked !== undefined) {
          await subject.update({ [`system.resources.${resource}.temporary`]: remainingBlock });
        }

        await Events.applyDamage(request.sourceInfo, context.result, request.item, request.actor, subject, request.origin, renderData);
        TokenUtils.showFloatyText(subject, `${-damageTaken} ${resource.toUpperCase()}`, color);

        // Chat message
        damageTaken = Math.abs(damageTaken);
        // Set flags
        const flags = new FlagBuilder();
        flags.set(Flags.ChatMessage.Damage, damageTaken);
        flags.set(Flags.ChatMessage.Source, context.sourceInfo);

        const chat = new ChatMessageBuilder(subject, request.item).withData(renderData);
        chat.withFlags(flags.toObject());

        ChatMessageSections.template(
          chat.sections,
          "chat/chat-section-apply-damage",
          {
            message: context.message,
            actor: subject.name,
            uuid: subject.uuid,
            rootUuid: subject.resolveUuid(),
            amount: damageTaken,
            content: content,
            pressure: pressure,
            amountBlocked: amountBlocked,
            result: context.result,
            from: StringUtils.localize(request.sourceInfo.name),
            sourceActorUuid: request.sourceInfo.actorUuid,
            resource: resource.toUpperCase(),
            sourceItemUuid: request.sourceInfo.itemUuid,
            breakdown: context.breakdown,
          },
          ChatSectionOrder.details,
        );
        await chat.create();

        return result; // keep the result from modifyTokenAttribute if needed
      }).then(async (result) => {
        // OPTIONAL: If staggered
        if (pressure?.staggered) {
          updates.push(Pressure.createStaggerChatMessage(context));
        }
        return result;
      }),
    );

  }

  return Promise.all(updates);
}

/**
 * @param {DamageData} damageData
 * @param {SourceInfo} sourceInfo
 * @param {String[]} traits
 * @param {PotencyActionOptions} options
 * @returns {ChatAction}
 */
function getChatAction(damageData, sourceInfo, traits, options = { potency: undefined }) {
  const icon = AH.icons.applyDamage;
  const resolved = damageData.resolved;
  const tooltip = StringUtils.localize("AH.CHAT.ACTION.ApplyDamageTooltip", {
    amount: resolved.total,
    type: StringUtils.localize(AH.damageTypes[damageData.type]),
  });
  const action = new ChatAction("applyDamage", icon, tooltip, {
    damageData: damageData,
    sourceInfo: sourceInfo,
    traits: traits,
  })
    .setFlag(Flags.ChatMessage.Damage, resolved.total)
    .withTraits(traits)
    .withDataset({
      potency: options.potency,
    })
    .requiresOwner();

  if (options.potency) {
    action.withDataset({
      potency: options.potency,
    });

    if (options.selected) {
      action.withSelected();
    }

    if (options.label) {
      action.withLabel("AH.CHAT.ACTION.ApplyDamage");
    }
  }
  else {
    action.withSelected();
    action.withLabel("AH.CHAT.ACTION.ApplyDamage");
  }

  return action;
}

/**
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
function onRenderChatMessage(message, html) {
  if (!message.getFlag(systemID, Flags.ChatMessage.Damage)) {
    return;
  }

  ChatMessageHelper.handleClick(message, html, "applyDamage", async (dataset) => {
    const fields = StringUtils.fromBase64(dataset.fields);
    const sourceInfo = SourceInfo.fromObject(fields.sourceInfo);
    const damageData = new DamageData(fields.damageData);
    const targets = await ChatAction.getTargetsFromAction(dataset);
    const traits = fields.traits ?? [];
    const request = new DamageRequest(sourceInfo, targets, damageData, traits);
    if (traits) {
      request.addTraits(traits);
    }
    return process(request);
  });

  ChatMessageHelper.handleClickRevert(message, html, "revertDamage", async (dataset) => {
    const uuid = dataset.uuid;
    const actor = fromUuidSync(uuid);
    const updates = [];
    const amountRecovered = Number(dataset.amount);
    const resource = dataset.resource.toLowerCase();
    updates.push(actor.modifyTokenAttribute(`resources.${resource}`, amountRecovered, true));
    TokenUtils.showFloatyText(actor, `${amountRecovered} ${resource}`, "lightgreen");
    return Promise.all(updates);
  });
}

/** @type ActionCallback **/
const onProcessAction = async (config, actor, item) => {
  if (config.hasDamage) {
    Events.calculateDamage(actor, item, config);
    const sourceInfo = config.sourceInfo;
    const traits = config.getTraits();

    // We will begin modifying this before setting it back
    const damage = config.damage;

    // 1.) Set attribute scaling
    const { primary, secondary } = Formulas.calculateAttributeInputs(config, actor);
    if (primary && secondary) {
      const secondaryDamage = damage.components[1];
      // Add high roll to primary damage
      damage.add("AH.CHECK.PrimaryAttribute", {
        type: damage.type,
        amount: primary,
      });
      // Add low roll to secondary damage
      if (secondaryDamage) {
        damage.add("AH.CHECK.SecondaryAttribute", {
          type: secondaryDamage.type,
          amount: secondary,
        });
      }
    }

    // 2.) Evaluate any components that have expressions
    const context = new EvaluationContext(actor, item, config.getTargets());
    let total = 0;
    for (const component of damage.components) {
      let amount = component.amount;
      amount = await Expressions.evaluateAsync(amount, context);
      component.amount = amount;
      total += amount;
    }

    // 3.) Add outgoing modifiers
    /** @type CharacterParametersDataModel **/
    const outgoing = actor?.system?.parameters;
    if (outgoing) {
      for (const type of damage.types) {
        const mods = outgoing.damage.resolve(type, "outgoing");
        if (mods.length) {
          for (const mod of mods) {
            damage.modify(damage.type, mod);
          }
        }
      }
    }

    // 4.) Add power modifiers
    if (config.power) {
      damage.modify("universal", {
        key: "skill",
        multiplicative: AH.power[config.power].multiplicative,
      });
    }

    // 5.) Set Potency
    if (config.isCheck) {
      config.setPotency((tiers) => {
        // Standard
        const standardDamage = new DamageData(damage);
        const standard = getChatAction(standardDamage, sourceInfo, traits, {
          potency: "standard",
        });
        tiers.standard.components.push({
          text: standardDamage.toString(),
          actions: [standard],
        });

        // Reduced
        const reducedDamage = standardDamage.duplicate(d => {
          d.modify("universal", {
            multiplicative: 0.5,
          });
        });
        const reducedAction = getChatAction(reducedDamage, sourceInfo, traits, {
          potency: "reduced",
        });
        tiers.reduced.components.push({
          text: reducedDamage.toString(),
          actions: [reducedAction],
        });

        // Powerful
        const powerfulDamage = standardDamage.duplicate(d => {
          d.add("AH.PIPELINE.CriticalBonus", {
            type: "untyped",
            amount: primary,
          });
        });
        const powerful = getChatAction(powerfulDamage, sourceInfo, traits, {
          potency: "powerful",
        });
        tiers.powerful.components.push({
          text: powerfulDamage.toString(),
          actions: [powerful],
        });
      });
    }
    else {
      config.updateTargetResults("standard");
      config.addAction(getChatAction(damage, sourceInfo, traits, {
        potency: "standard",
        selected: true,
        label: true,
      }));
    }
  }
};

/** @type ActionRenderCallback **/
const onRenderAction = (config, data, actor, item, registerCallback) => {
  if (config.damage) {
    data.sections.push({
      order: ChatSectionOrder.damage,
      partial: systemTemplatePath("chat/chat-section-damage"),
      data: {
        damage: config.damage,
      },
    });
  }
};

/**
 * Initializes the callback handlers for this pipeline.
 */
function initialize() {
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
  Hooks.on(AH.hooks.PROCESS_ACTION, (config, actor, item, registerCallback) => {
    onProcessAction(config, actor, item);
  });
  Hooks.on(AH.hooks.RENDER_ACTION, onRenderAction);
}

/**
 * Handles damage application onto characters.
 */
const Damage = Object.freeze({
  initialize,
  process,
});

export default Damage;
