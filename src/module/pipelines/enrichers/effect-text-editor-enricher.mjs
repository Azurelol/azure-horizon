import { StringUtils, TextEditorUtils } from "../../utils/_module.mjs";
import { systemID } from "../../constants.mjs";
import AH from "../../config.mjs";
import StatusEffects from "../../data/effect/status-effects.mjs";
import Effects from "../effects.mjs";
import Targeting from "../../helpers/targeting.mjs";

const effectPropertyGroups = [TextEditorUtils.propertyPattern("event", "e", "\\w+"), TextEditorUtils.propertyPattern("interval", "i", "\\d"), TextEditorUtils.propertyPattern("tracking", "t", "\\w+")];
const ID = "EffectTextEditorEnricher";
const CLASS_NAME = "effect-enricher";

/**
 * @type {TextEditorEnricherConfig}
 */
const enricher = {
  id: ID,
  pattern: TextEditorUtils.pattern("EFFECT", "(?<id>[a-zA-Z0-9+/.-]+={0,3})", effectPropertyGroups),
  enricher: inlineEffectEnricher,
  onRender: onRender,
};

/**
 * @param effect
 * @param label
 * @returns {HTMLAnchorElement}
 */
function createEffectAnchor(effect, label) {
  const anchor = TextEditorUtils.anchor();
  anchor.draggable = true;
  anchor.dataset.effect = StringUtils.toBase64(effect);
  anchor.setAttribute("data-tooltip", `${StringUtils.localize("AH.CHAT.ACTION.ApplySelected")}`);
  TextEditorUtils.icon(anchor, "ah-icon-placeholder");
  anchor.append(label ? label : effect.name);
  return anchor;
}

/**
 * @param {AHActiveEffect} effect
 * @param config
 * @param label
 * @returns {HTMLAnchorElement}
 */
function createCompendiumEffectAnchor(effect, config, label) {
  const anchor = TextEditorUtils.anchor();
  anchor.draggable = true;
  anchor.dataset.effect = StringUtils.toBase64(effect);
  if (effect?.flags[systemID]?.[AH.flags.ActiveEffect.Source]) {
    const sourceInfo = effect.flags[systemID][AH.flags.ActiveEffect.Source];
    anchor.dataset.uuid = sourceInfo.effectUuid;
    anchor.dataset.slug = sourceInfo.slug;
  } else {
    anchor.dataset.uuid = effect.uuid;
    anchor.dataset.slug = effect.parent?.system?.slug;
  }
  anchor.dataset.config = StringUtils.toBase64(config);
  anchor.setAttribute("data-tooltip", `${StringUtils.localize("AH.CHAT.ACTION.ApplySelected")}`);
  TextEditorUtils.image(anchor, effect.img);
  anchor.append(label ? label : effect.name);
  return anchor;
}

/**
 * @returns {HTMLAnchorElement}
 */
function createBrokenAnchor() {
  const anchor = TextEditorUtils.anchor();
  anchor.classList.add("broken");
  TextEditorUtils.icon(anchor, "broken");
  anchor.append(StringUtils.localize("AH.CHAT.EffectInvalid"));
  return anchor;
}

/**
 * @param effectValue
 * @param status
 * @param config
 * @returns {HTMLAnchorElement}
 */
function createStatusAnchor(effectValue, status, config) {
  const anchor = TextEditorUtils.anchor();
  anchor.draggable = true;
  anchor.dataset.status = effectValue;
  anchor.dataset.config = StringUtils.toBase64(config);
  const localizedName = StringUtils.localize(status.name);
  anchor.setAttribute("data-tooltip", `${StringUtils.localize("AH.PIPELINE.MESSAGE.ApplySelected")}`);
  TextEditorUtils.image(anchor, status.img);
  anchor.append(localizedName);
  return anchor;
}

/**
 * @param match
 * @returns {AH_ActiveEffectConfiguration}
 */
function parseConfigData(match) {
  let event = match.groups.event;
  if (event) {
    switch (event) {
      case "eot":
        event = "endOfTurn";
        break;
      case "sot":
        event = "startOfTurn";
        break;
      case "eor":
        event = "endOfRound";
        break;
      case "eos":
        event = "endOfScene";
        break;
      case "rest":
        event = "rest";
        break;
    }
  }
  const interval = match.groups.interval;
  const tracking = match.groups.tracking;
  const label = match.groups.label;
  return {
    event: event,
    interval: interval,
    tracking: tracking,
    name: label,
  };
}

/**
 * @param {String} match
 * @param options
 */
async function inlineEffectEnricher(match, options) {
  /** @type String */
  const id = match.groups.id;
  const label = match.groups.label;
  const config = parseConfigData(match);

  if (id in StatusEffects.entries) {
    const status = StatusEffects.entries[id];
    if (status) {
      return createStatusAnchor(id, status, config);
    }
  } else {
    const effectData = await Effects.getEffectData(id);
    if (effectData) {
      return createCompendiumEffectAnchor(effectData, config, label);
    }
  }

  return createBrokenAnchor();
}

/**
 * @param {HTMLElement} element
 * @returns {Promise<void>}
 */
async function onRender(element) {
  const renderContext = TextEditorUtils.getRenderContext(element);

  const effectData = StringUtils.fromBase64(renderContext.dataset.effect);
  const status = renderContext.dataset.status;
  const config = StringUtils.fromBase64(renderContext.dataset.config);

  // Click handler
  element.addEventListener("click", async function (event) {
    const isCtrlClick = event.ctrlKey;
    const targets = await Targeting.getSelected();
    if (!targets.length) return;

    targets.forEach((actor) => {
      if (effectData) {
        if (isCtrlClick) {
          Effects.removeEffect(actor, renderContext.sourceInfo, effectData);
        } else {
          Effects.applyEffect(actor, effectData, renderContext.sourceInfo, config);
        }
      } else if (status) {
        if (isCtrlClick) {
          Effects.disableStatusEffect(actor, status);
        } else if (!actor.statuses.has(status)) {
          actor.toggleStatusEffect(status, renderContext.sourceInfo, config);
        }
      }
    });
  });

  // Dragstart handler
  element.addEventListener("dragstart", function (event) {
    const data = {
      type: ID,
      sourceInfo: renderContext.sourceInfo,
      config: StringUtils.fromBase64(renderContext.dataset.config),
      effect: StringUtils.fromBase64(renderContext.dataset.effect),
      status: renderContext.dataset.status,
    };

    event.dataTransfer.setData("text/plain", JSON.stringify(data));
    event.stopPropagation();
  });

  // Contextmenu handler
  element.addEventListener("contextmenu", function (event) {
    event.preventDefault();
    event.stopPropagation();

    let effectData;
    if (renderContext.dataset.status) {
      const status = renderContext.dataset.status;
      const statusEffect = CONFIG.statusEffects.find((value) => value.id === status);
      if (statusEffect) {
        effectData = { ...statusEffect, statuses: [status] };
      }
    } else {
      effectData = StringUtils.fromBase64(renderContext.dataset.effect);
    }

    if (effectData) {
      effectData.sourceInfo = renderContext.sourceInfo;

      const tempActor = new foundry.documents.Actor.implementation({ name: "Temp Actor", type: "character" });
      const tempEffect = new foundry.documents.ActiveEffect.implementation(effectData, { temporary: true, parent: tempActor });
      const ActiveEffectSheetClass = tempEffect._getSheetClass();
      const sheet = new ActiveEffectSheetClass({ document: tempEffect, editable: false });
      sheet.render({ force: true });
    }
  });
}

async function onDropActor(actor, sheet, { type, sourceInfo, config, effect, status }) {
  if (type === ID) {
    if (status) {
      if (!actor.statuses.has(status)) {
        await actor.toggleStatusEffect(status, sourceInfo, config);
      }
    } else if (effect) {
      await Effects.applyEffect(actor, effect, sourceInfo, config);
    }
    return false;
  }
}

export const EffectTextEditorEnricher = Object.freeze({
  enrichers: [enricher],
  parseConfigData,
  onDropActor,
  effectPropertyGroups,
  createEffectAnchor,
});
