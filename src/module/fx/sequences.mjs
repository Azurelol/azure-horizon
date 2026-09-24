import { Presets } from "./presets.mjs";
import { getSystemSetting } from "../constants.mjs";

// Uses: https://fantasycomputer.works/FoundryVTT-Sequencer/#/

/**
 * @returns {Number}
 */
function getVolume() {
  return getSystemSetting("volume");
}

/**
 * @param {Sequence} sequence
 * @param {Preset} preset
 */
function playSoundEffect(sequence, preset) {
  if (!preset?.sound) {
    return;
  }
  if (
    !getSystemSetting("sfx", false)
  ) {
    return;
  }

  let section = sequence
    .sound()
    .file(preset.sound)
    .volume(getVolume());

  if (preset.duration) {
    const duration = preset.duration * 1000;
    section.timeRange(0, duration).fadeOutAudio(duration);
  }
}

/**
 * @param {Sequence} sequence
 * @param {Preset} preset
 * @param token
 * @param {Number} scale
 * @returns {EffectSection}
 */
function playAnimationOnToken(sequence, preset, token, scale = 1) {
  if (!preset) {
    return null;
  }

  const animation = preset.animation;
  console.debug(`Playing animation ${animation} on token ${token.name}`);
  playSoundEffect(sequence, preset);
  let section = sequence
    .effect()
    .file(animation)
    .atLocation(token)
    .scaleToObject(scale, {
      considerTokenScale: true,
    });

  if (preset.duration) {
    section.duration(preset.duration * 1000);
  }

  return section;
}

/**
 * @param {Sequence} sequence
 * @param {Token} sourceToken
 * @param {Token} targetToken
 * @param {String} type
 * @param {Set<String>} traits
 */
function animateDamageTaken(
  sequence,
  sourceToken,
  targetToken,
  type,
) {
  playAnimationOnToken(
    sequence,
    Presets.get(type),
    targetToken,
  );
}

/**
 * @description Handles an event where a character performs an attack
 * @param {PerformActionEvent} event
 */
async function animateAction(event) {
  if (!event.source.token || !event.targets || event.targets.length === 0) {
    return;
  }
  let sequence = new Sequence();
  const traits = new Set(event.config.traits);
  const preset = Presets.resolve(event.item, traits);
  if (preset) {
    // ui.notifications.info(`Performing action for ${event.source.actor.name}`);
  }
  else {
    console.debug("Did not resolve a preset.");
    return;
  }

  for (const target of event.targets) {
    playSoundEffect(sequence, preset);
    sequence
      .effect()
      .file(preset.animation)
      .atLocation(target.token)
      .scaleToObject(1.5);
    // animateDamageTaken(sequence, event.source.token, target.token, type, traits);
  }

  switch (event.itemGroup) {
    case "attack": {
    }
      break;
    case "skill":
      break;
    case "spell":
      break;
    case "item":
      break;
  }
  await sequence.play({
    preload: true,
  });
}

/**
 * @typedef DamageResolution
 * @property {Number} total
 * @property modifiers
 * @property types
 * @property {DamageInstance[]} instances
 */
/**
 * @description Dispatched when an actor suffers damage
 * @typedef DamageEvent
 * @property {CharacterInfo|null} source
 * @property {CharacterInfo} target
 * @property {DamageResolution} damage
 * @property {SourceInfo} sourceInfo
 * @property {AHItem} item
 * @property {AH_ItemGroup} itemGroup
 * @property {ChatMessageBuilderData} renderData
 * @property {String} origin An id used to prevent cascading.
 */

/**
 * @description Handles an event where a character performs an attack
 * @param {DamageEvent} event
 */
async function animateDamage(event) {
  if (!event.target) {
    return;
  }
  let sequence = new Sequence();
  animateDamageTaken(sequence, event.source.token, event.target.token, event.damage.types[0]);
  await sequence.play({
    preload: true,
  });
}

export const Sequences = Object.freeze({
  animateAction,
  animateDamage,
});
