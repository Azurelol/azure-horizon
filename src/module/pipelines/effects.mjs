import AH from "../config.mjs";
import { isActorType, isItemType, systemID } from "../constants.mjs";
import { ChatAction, ChatMessageHelper, FlagBuilder } from "../helpers/_module.mjs";
import { FoundryUtils, ObjectUtils, StringUtils } from "../utils/_module.mjs";
import { SourceInfo } from "../data/common/_module.mjs";
import statusEffects from "../data/effect/status-effects.mjs";
import { CompendiumIndex } from "../data/compendium/_module.mjs";
import Events from "./events.mjs";

/** *
 * @param {String} id An uuid or slug
 * @returns {Promise<ActiveEffectData>}
 * @remarks It makes a safe clone of the data when returning it, thus it will NOT be an ActiveEffect instance.
 */
async function getEffectData(id) {
  let effect;
  let sourceInfo;

  // Resolve by status id
  if (id in statusEffects.entries) {
    effect = statusEffects.entries[id];
  } else {
    // Resolve by uuid
    if (FoundryUtils.isUUID(id)) {
      effect = await fromUuid(id);
    }
    // Resolve by slug
    else {
      const entry = await CompendiumIndex.instance.getEffectBySlug(id);
      if (entry) {
        effect = await fromUuid(entry.uuid);
      }
    }
    // Get the first AE attached to the item
    if (effect && isItemType(effect)) {
      sourceInfo = new SourceInfo(effect.name, null, effect.uuid, null, effect.system.slug);
      effect = effect.effects.entries().next().value[1];
    }
  }
  if (!effect) {
    console.warn(`No effect with id '${id}' could be resolved.`);
  }

  if (effect) {
    effect = ObjectUtils.safeClone(effect);
    if (sourceInfo) {
      effect.flags = new FlagBuilder().set(AH.flags.ActiveEffect.Source, sourceInfo);
    }
  }

  return effect;
}

/**
 * @param {ActiveEffectData} effect
 * @param {SourceInfo} sourceInfo
 * @param {String} identifier An unique identifier for the effect
 * @returns {Object}
 */
function createEffectFlags(effect, sourceInfo, identifier) {
  const fb = new FlagBuilder();
  fb.set(AH.flags.ActiveEffect.Temporary, true);
  fb.set(AH.flags.ActiveEffect.Source, sourceInfo);
  fb.set(AH.flags.ActiveEffect.Identifier, identifier);
  return fb.toObject();
}

/**
 * @param {AHActor|AHItem} document
 * @param {ActiveEffectData} effect
 * @param {SourceInfo} sourceInfo
 * @param {AH_ActiveEffectConfiguration} config
 * @returns {AHActiveEffect}
 */
async function applyEffect(document, effect, sourceInfo, config = undefined) {
  if (document) {
    if (isActorType(document) && !document.isCharacterType) {
      ui.notifications.error("AH.DIALOG.WARNING.ActorSheetEffectNotSupported", { localize: true });
      return;
    }
    const flags = createEffectFlags(effect, sourceInfo, sourceInfo?.slug);
    // eslint-disable-next-line no-undef
    const instance = await ActiveEffect.create(
      {
        ...effect,
        flags: flags,
      },
      { parent: document },
    );
    // The creation could have been rejected
    if (instance) {
      await instance.applyConfiguration(config);
      //await sendToChatEffectAdded(instance, document, sourceInfo?.name);
    }
    return instance;
  }
}

/**
 * @param {AHActor|AHItem} document
 * @param {SourceInfo} source
 * @param {AHActiveEffect} effect
 */
function removeEffect(document, source, effect) {
  if (!document) return;

  const existingEffect = document.effects.find(
    (e) =>
      e.getFlag(systemID, AH.flags.ActiveEffect.Temporary) &&
      (e.sourceItem === source) &&
      (e.changes.length === effect.changes.length) &&
      e.changes.every((change, index) => (change.key === effect.changes[index].key) &&
        (change.mode === effect.changes[index].mode)
        && (change.value === effect.changes[index].value)),
  );

  if (existingEffect) {
    //sendToChatEffectRemoved(effect, document);
    existingEffect.delete();
  } else {
    console.log("No matching effect found to remove.");
  }
}

/**
 * Disable a status effect on an Actor, if it's currently active.
 * @param {AHActor} actor - The actor from which to remove the status effect.
 * @param {string} statusEffectId - The effect ID from CONFIG.statusEffects.
 * @returns {Promise<boolean>} - Whether the effect was removed.
 */
async function disableStatusEffect(actor, statusEffectId) {
  if (!actor.isCharacterType) {
    ui.notifications.error("AH.DIALOG.WARNING.ActorSheetEffectNotSupported", { localize: true });
    return false;
  }
  const existing = actor.effects.filter((effect) => effect.statuses.has(statusEffectId));
  if (existing.length > 0) {
    await Promise.all(
      existing.map((e) => {
        Events.status(actor, statusEffectId, false);
        return e.delete();
      }),
    );
    return true;
  }
  return false;
}

/**
 * @param {String} id An uuid or slug.
 * @param {SourceInfo} sourceInfo
 * @param {AH_ActiveEffectDuration} duration
 * @param includeLabel
 * @returns {Promise<ChatAction>}
 */
async function getChatAction(id, sourceInfo, duration = undefined, includeLabel = true) {
  const effectData = await getEffectData(id);
  let name;
  let icon;
  let img;
  if (effectData) {
    if (effectData.img) {
      img = effectData.img;
    }
    else {
      icon = "ra ra-biohazard";
    }
    name = StringUtils.localize(effectData.name);
  } else {
    ui.notifications.warn(`Could not resolve the effect with id: ${id}`);
    return null;
  }

  const tooltip = StringUtils.localize("AH.CHAT.ACTION.ApplyEffect", {
    effect: name,
  });

  const action = new ChatAction("applyEffect", icon, tooltip, {
    sourceInfo: sourceInfo,
    duration: duration,
  })
    .requiresOwner()
    .setFlag(AH.flags.ChatMessage.Effect)
    .withSelected()
    .withImage(img)
    .withDataset({
      ["effect-id"]: id,
    });
  if (includeLabel) {
    action.withLabel(tooltip);
  }
  return action;
}

/**
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
function onRenderChatMessage(message, html) {
  if (!message.getFlag(systemID, AH.flags.ChatMessage.Effect)) {
    return;
  }

  ChatMessageHelper.handleClick(message, html, "applyEffect", async (dataset) => {
    const effectId = dataset.effectId;
    const isStatus = effectId in statusEffects.entries;

    let sourceInfo = SourceInfo.none;
    let duration;
    /** @type AH_ActiveEffectConfiguration **/
    let configuration;

    if (dataset.fields) {
      const fields = StringUtils.fromBase64(dataset.fields);
      if (fields.sourceInfo) {
        sourceInfo = SourceInfo.fromObject(fields.sourceInfo);
      }
      if (fields.duration) {
        duration = fields.duration;
        configuration = {
          ...duration,
        };
      }
    }

    const targets = await ChatAction.getTargetsFromAction(dataset);
    console.debug(`Applying effect ${effectId} to ${targets}`);

    if (isStatus) {
      for (const target of targets) {
        if (!target.isOwner) {
          ui.notifications.warn("AH.DIALOG.WARNING.ActorOwnership", { localize: true });
          continue;
        }
        await target.toggleStatusEffect(effectId, sourceInfo, configuration);
      }
    } else {
      const effect = await getEffectData(effectId);
      if (!effect) {
        return;
      }
      const esi = effect.flags?.[systemID]?.[AH.flags.ActiveEffect.Source];
      if (esi) {
        sourceInfo.withSlug(esi.slug);
      }
      if (effect)
        for (const target of targets) {
          if (!target.isOwner) {
            ui.notifications.warn("AH.DIALOG.WARNING.ActorOwnership", { localize: true });
            continue;
          }
          await applyEffect(target, effect, sourceInfo, configuration);
        }
    }

  });

  ChatMessageHelper.handleClickRevert(message, html, "removeEffect", async (dataset) => {
    const actorId = dataset.actorId;
    const effectId = dataset.id;
    console.debug(`Removing effect ${effectId} from ${actorId}`);
    /** @type AHActor **/
    const actor = fromUuidSync(actorId);
    const effect = actor.effects.get(effectId);
    if (effect) {
      effect.delete();
    }
  });
}

/**
 * @param {AH_Potency} potency
 * @param {ApplyEffectData} effectData
 * @param {SourceInfo} sourceInfo
 * @returns {Promise<void>}
 */
async function getPotencyActions(potency, effectData, sourceInfo) {
  let actions;
  switch (potency) {
    case "reduced":
      actions = [];
      break;
    case "standard":
      actions = await Promise.all(effectData.entries.map(async e => await getChatAction(e, sourceInfo, effectData.duration, false)));
      break;
    case "powerful":
      actions = await Promise.all(effectData.entries.map(async e => await getChatAction(e, sourceInfo, effectData.duration, false)));
      break;
  }
  return actions;
}

async function _onProcessAction(config, actor, item) {
  if (config.hasEffects) {
    const effectData = config.effects;
    if (config.isCheck && (effectData.selector !== "buff")) {
      const standard = await getPotencyActions("standard", effectData, config.sourceInfo);
      const powerful = await getPotencyActions("powerful", effectData, config.sourceInfo);
      config.setPotency(potency => {
        potency.standard.components.push({
          actions: standard,
        });
        potency.powerful.components.push({
          actions: powerful,
        });
      });
    }
    else {
      for (const id of effectData.entries) {
        config.addAction(getChatAction(id, config.sourceInfo, effectData.duration));
      }
    }
  }
}

/** @type ActionProcessCallback **/
const processAction = (config, actor, item, registerCallback) => {
  registerCallback(_onProcessAction);
};

/** @type ActionRenderCallback **/
const onRenderAction = (config, data, actor, item, registerCallback) => {

};

/**
 * Initializes the callback handlers for this pipeline.
 */
function initialize() {
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
  Hooks.on(AH.hooks.PROCESS_ACTION, processAction);
  Hooks.on(AH.hooks.RENDER_ACTION, onRenderAction);
}

const Effects = Object.freeze({
  initialize,
  getEffectData,
  applyEffect,
  removeEffect,
  disableStatusEffect,
});

export default Effects;
