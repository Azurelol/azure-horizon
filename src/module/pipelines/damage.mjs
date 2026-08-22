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
import { systemID, systemTemplatePath } from "../constants.mjs";
import DamageData from "./damage-data.mjs";
import Events from "./events.mjs";
import { StringUtils, TokenUtils } from "../utils/_module.mjs";
import { DamageRequest } from "./_module.mjs";
import PipelineContext from "./pipeline-context.mjs";
import { Formulas } from "../ruleset/_module.mjs";
import Expressions from "./expressions.mjs";

/**
 * @property {DamageData} damageData
 * @property {String} message
 * @property {DamageInstance[]} instances Combined from the input damage data.
 * @property {DamageResolution} result Calculated during processing.
 * @property {Record<AH_DamageType, ParameterModifier>} modifiers Gathered during processing.
 * @property {Boolean} pressured Whether the actor was pressured by the damage they took.
 * @property {String} pressureTrigger The pressure trigger (weapon group, affinity)
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
    const difference = subject.system.resources[resource].value - damageTaken;
    if (difference < 0) {
      damageTaken -= Math.abs(difference);
    }

    // If no damage was dealt or absorbed, exit early
    if (damageTaken === 0) {
      ui.notifications.warn(`The damage to ${subject.name} was reduced to 0.`);
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ subject }),
        content: StringUtils.localize("AH.DIALOG.WARNING.ApplyNoDamage", {
          actor: subject.name,
          from: request.sourceInfo.name,
        }),
      });
      continue;
    }

    let content = [];
    // If the target was pressured (elites/solos)
    if (context.pressured) {
      console.debug("Pressuring");
    }

    // Create the update
    updates.push(
      subject.modifyTokenAttribute(`resources.${resource}`, -damageTaken, true).then(async (result) => {

        /** @type ChatMessageBuilderData **/
        let renderData = {
          tags: [],
          sections: [],
          postRenderActions: [],
          flags: [],
        };

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
      }),
    );

  }

  return Promise.all(updates);
}

/**
 * @param {DamageData} damageData
 * @param {SourceInfo} sourceInfo
 * @param {String[]} traits
 * @param includeLabel
 * @returns {ChatAction}
 */
function getChatAction(damageData, sourceInfo, traits, includeLabel = true) {
  const icon = AH.icons.damage;
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
    .withSelected()
    .withTraits(traits)
    .requiresOwner();
  if (includeLabel) {
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

  // TODO: Update
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

const FIXED_SCALING = 0.25;

/** @type ActionCallback **/
const onProcessAction = async (config, actor, item) => {
  if (config.hasDamage) {
    Events.calculateDamage(actor, item, config);
    const sourceInfo = config.sourceInfo;
    const traits = config.getTraits();

    // We will begin modifying this before setting it back
    const damage = config.damage;

    // 1.) Set attribute scaling
    const primary = config.check.hr?.result ?? Formulas.round(config.check.primary.dice * FIXED_SCALING);
    const secondary = config.check.lr?.result ?? Formulas.round(config.check.secondary.dice * FIXED_SCALING);
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

    // 2.) Add proficiency bonus to primary type
    const prof = Formulas.calculateProficiencyBonus(actor.system.level);
    if (prof) {
      damage.add("AH.DAMAGE.ProficiencyBonus", {
        amount: prof,
        type: damage.type,
        enabled: true,
      });
    }

    // 3.) Evaluate any components that have expressions
    const context = new EvaluationContext(actor, item, config.getTargets());
    for (const component of damage.components) {
      let amount = component.amount;
      amount = await Expressions.evaluateAsync(amount, context);
      component.amount = amount;
    }

    // 4.) Add outgoing modifiers
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

    // 3.2) Add power modifiers
    if (config.power) {
      damage.modify("universal", {
        key: "skill",
        multiplicative: AH.power[config.power].multiplicative,
      });
    }

    // 4.) Set Potency
    if (config.isCheck) {
      config.setPotency((tiers) => {
        // Standard
        const standardDamage = new DamageData(damage);
        const standard = getChatAction(standardDamage, sourceInfo, traits, false);
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
        const reducedAction = getChatAction(reducedDamage, sourceInfo, traits, false);
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
        const powerful = getChatAction(powerfulDamage, sourceInfo, traits, false);
        tiers.powerful.components.push({
          text: powerfulDamage.toString(),
          actions: [powerful],
        });
      });
    }
    else {
      config.addAction(getChatAction(damage, sourceInfo, traits, true));
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
