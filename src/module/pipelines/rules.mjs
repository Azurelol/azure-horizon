import AH from "../config.mjs";
import { AHItem } from "../documents/_module.mjs";
import { CharacterInfo } from "../data/common/_module.mjs";
import RuleElementContext from "./rule-element-context.mjs";

/**
 * @param {CalculateDamageEvent} event
 * @returns {Promise<void>}
 */
async function onCalculateDamageEvent(event) {
  await evaluate(AH.hooks.CALCULATE_DAMAGE_EVENT, event, event.source, event.targets, {
    config: event.config,
  });
}

/**
 * @param {AHActiveEffect} effect
 * @returns {Promise<AHItem|null>}
 */
async function getTemporaryItem(effect) {
  const temporaryItem = await AHItem.create(
    {
      name: "TemporaryItem",
      type: "rule",
    },
    { temporary: true },
  );
  temporaryItem.name = effect.name;
  temporaryItem.img = effect.img;
  return temporaryItem;
}

/**
 * @type {Set<string>} Events that can possibly have no source character.
 */
const eventsWithoutSourceCharacter = new Set([AH.hooks.COMBAT_EVENT]);

/**
 * @param {ActiveEffect|AHActiveEffect} effect
 * @returns {boolean}
 */
function canProcessEffect(effect) {
  const disabled = effect.isSuppressed || effect.disabled;
  if (disabled || (effect.system.rules.size === 0)) {
    return false;
  }
  return true;
}

/**
 * @param {String} type
 * @param {*} event
 * @param {CharacterInfo} source
 * @param {CharacterInfo[]} targets
 * @param {RuleElementContext} data Properties for the rule element context.
 * @return {Promise<void>}
 */
async function evaluate(type, event, source, targets, data = undefined) {
  // This can happen when sending items to chat.
  if (!source) {
    // But some events
    if (!eventsWithoutSourceCharacter.has(type)) {
      return;
    }
  }
  // Always include the source as part of the scene character pool; useful for when they are not part of the encounter
  const sceneCharacters = CharacterInfo.getSceneCharacters(source ? [source, ...targets] : targets);
  for (const character of sceneCharacters) {
    for (const effect of character.actor.appliedEffects) {
      if (!canProcessEffect(effect)) {
        continue;
      }
      /** @type RuleElementContext **/
      let contextData = {
        type: type,
        effect: effect,
        event: event,
        character: character,
        source: source,
        targets: targets,
        scene: {
          characters: sceneCharacters,
        },
        ...data,
      };
      // If this effect was attached on an item (best case)
      if (effect.parent.documentName === "Item") {
        contextData.item = effect.parent;
      }
      // If not, we will use a dummy item
      else {
        contextData.item = await getTemporaryItem(effect);
      }

      const context = new RuleElementContext(contextData);
      for (const element of effect.system.rules) {
        await element.evaluate(context);
      }
    }
  }
}

/**
 * @description Initialize the pipeline's hooks
 */
function initialize() {
  Hooks.on(AH.Hooks.CALCULATE_DAMAGE_EVENT, onCalculateDamageEvent);
}

const Rules = Object.freeze({
  initialize,
});

export default Rules;
