import { SourceInfo } from "../data/common/_module.mjs";

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
import { systemID } from "../constants.mjs";
import DamageData from "./damage-data.mjs";
import Events from "./events.mjs";
import { StringUtils, TokenUtils } from "../utils/_module.mjs";
import { DamageRequest } from "./_module.mjs";
import PipelineContext from "./pipeline-context.mjs";
import { Formulas } from "../ruleset/_module.mjs";

/**
 * @property {DamageData} damageData
 * @property {String} message
 * @property {DamageInstance[]} instances Combined from the input damage data.
 * @property {DamageResult} result Calculated during processing.
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
 * @typedef DamageResult
 * @property {DamageInstance[]} instances The distinct damage instances, with incremental/multiplicative bonuses already applied.
 * @property {Number} total The total damage, combining that of the distinct instances.
 * @property {String[]} traits
 */

/**
 * @param {DamageContext} context
 * @return {Boolean}
 */
function joinComponents(context) {
  const _components = new Map();

  for (const component of context.damageData.components) {
    if (!component.enabled) continue;

    const amount = Number(component.amount) || 0;
    const traits = component.traits || [];

    if (!_components.has(component.type)) {
      _components.set(component.type, {
        label: component.label,
        enabled: true,
        amount,
        type: component.type,
        traits: [...traits],
      });
      continue;
    }

    const existing = _components.get(component.type);
    existing.amount += amount;
    existing.traits.push(...traits);
  }

  context.instances = [..._components.values()];
}

/**
 * @param {DamageContext} context
 * @return {Promise<Boolean>}
 */
async function collectModifiers(context) {
  /** @type CharacterParametersDataModel **/
  const incoming = context.subject.system.parameters;

  for (const inst of context.instances) {
    const mods = incoming.damage.resolve(inst.type, "incoming");
    // TODO: Leave them separate?
    const modifier = Formulas.joinModifiers(mods);
    context.modifiers[inst.type] = {
      [inst.type]: modifier,
    };
  }

  // TODO: CALL EVENT

}

/**
 * @param {DamageContext} context
 * @return {Boolean}
 */
function calculateResult(context) {

  /** @type DamageInstance[] **/
  let instances = [];
  for (const inst of context.instances) {
    let amount = inst.amount;
    const modifier = context.modifiers[inst.type];
    if (modifier) {
      amount += modifier.additive;
      amount *= modifier.multiplicative;
    }
    instances.push({
      type: inst.type,
      amount: amount,
    });
  }

  const total = instances.reduce((total, instance) => total + instance.amount, 0);
  if (total === undefined) {
    throw Error("Failed to calculate the damage result.");
  }

  context.result = {
    instances: instances,
    total: total,
  };

  context.message = "AH.PIPELINE.ChatApplyDamage";
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
    ui.notifications.info(`Applying damage to ${context.subject.name}`, { localize: true });
    joinComponents(context);
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
      subject.modifyTokenAttribute(`parameters.${resource}`, -damageTaken, true).then(async (result) => {

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
 * @param {DamageData} damageData *
 * @param {SourceInfo} sourceInfo
 * @param {String[]} traits
 * @returns {ChatAction}
 */
function getChatAction(damageData, sourceInfo, traits) {
  const icon = AH.icons[damageData.type];
  const tooltip = StringUtils.localize("AH.ACTION.ApplyDamageTooltip", {
    amount: damageData.total,
    type: StringUtils.localize(AH.damageTypes[damageData.type]),
  });
  return new ChatAction("applyDamage", icon, tooltip, {
    damageData: damageData,
    sourceInfo: sourceInfo,
    traits: traits,
  })
    .setFlag(Flags.ChatMessage.Damage, damageData.total)
    .withSelected()
    .withLabel("AH.ACTION.ApplyDamage")
    .withTraits(traits)
    .requiresOwner();
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
    updates.push(actor.modifyTokenAttribute(`parameters.${resource}`, amountRecovered, true));
    TokenUtils.showFloatyText(actor, `${amountRecovered} ${resource}`, "lightgreen");
    return Promise.all(updates);
  });
}

/** @type ActionProcessCallback **/
const onProcessAction = (config, actor, item, registerCallback) => {
  Events.calculateDamage(actor, item, config);
  if (config.hasDamage) {
    config.modifyDamage((dmg) => {
      const hr = config.hr;
      if (hr) {
        dmg.add("AH.CHECK.HighRoll.short", dmg.type, hr);
      }
      /** @type CharacterParametersDataModel **/
      const outgoing = actor?.system?.parameters;
      if (outgoing) {
        for (const component of dmg.components) {
          const mods = outgoing.damage.resolve(component.type, "outgoing");
          if (mods.length) {
            for (const mod of mods) {
              dmg.modify(dmg.type, mod);
            }
          }
        }
      }
    });
  }
};

/** @type ActionRenderCallback **/
const onRenderAction = (config, data, actor, item, registerCallback) => {
  if (config.damage) {
    const sourceInfo = config.sourceInfo;
    const traits = config.getTraits();

    config.setPotencies((potencies) => {

      const standardDamage = new DamageData(config.damage);
      const standard = getChatAction(standardDamage, sourceInfo, traits);

      const reducedDamage = standardDamage.duplicate(d => {
        const base = d.base;
        d.clear();
        d.add("AH.DAMAGE.Glancing", base.type, Math.round(base.amount * 0.5));
      });
      const reducedAction = getChatAction(reducedDamage, sourceInfo, traits);

      potencies.reduced.components.push({
        text: reducedDamage.toString(),
        actions: [reducedAction],
      });

      potencies.standard.components.push({
        text: standardDamage.toString(),
        actions: [standard],
      });

      const powerfulDamage = standardDamage.duplicate(d => {
        const criticalBonus = d.base.amount * 2;
        d.add("AH.PIPELINE.CriticalBonus", "untyped", criticalBonus);
      });
      const powerful = getChatAction(powerfulDamage, sourceInfo, traits);

      potencies.powerful.components.push({
        text: powerfulDamage.toString(),
        actions: [powerful],
      });
    });
  }

};

/**
 * Initializes the callback handlers for this pipeline.
 */
function initialize() {
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
  Hooks.on(AH.hooks.PROCESS_ACTION, onProcessAction);
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
