import { systemID, systemNS } from "../constants.mjs";

/**
 * @property {String[]} animations
 * @property {String|null} sound
 * @property {Number|null} duration If set, the maximum duration
 * @property {Number} scale
 * @property {Boolean} stretch
 */
class Preset {
  constructor() {
    this.stretch = true;
    this.scale = 1;
  }

  withInternalAnimation(...animations) {
    this.animations = animations.map(a => `${systemID}.vfx.${a}`);
    return this;
  }

  withAnimations(...animations) {
    this.animations = animations;
    return this;
  }

  withSound(sound) {
    this.sound = sound;
    return this;
  }

  withInternalSound(path) {
    this.sound = `azure-horizon.sfx.${path}`;
    return this;
  }

  get animation() {
    const length = this.animations.length;
    if (length > 1) {
      const randomIndex = Math.floor(Math.random() * length);
      return this.animations[randomIndex];
    }
    return this.animations[0];
  }

  withDuration(duration) {
    this.duration = duration;
    return this;
  }

  withScale(scale) {
    this.scale = scale;
    return this;
  }

  disableStretch() {
    this.stretch = false;
    return this;
  }
}

/**
 * @type {Object<String, Preset>}
 */
const presets = Object.freeze({
  sword: new Preset().withInternalSound("attack.sword"),

  piercing: new Preset().withInternalAnimation("piercing"),
  slashing: new Preset().withInternalAnimation("slashing"),
  bludgeoning: new Preset().withInternalAnimation("bludgeoning"),
});

/**
 * @param {AHItem} item
 * @param {Set<String>} traits
 * @returns {Preset}
 */
function resolve(item, traits) {
  const slug = item.system.slug.replace("-", "_");

  // Exact match
  const exactMatch = presets[slug];
  if (exactMatch) {
    return exactMatch;
  }
  // Loose match
  const matches = Object.keys(presets).filter(key => slug.includes(key) || traits.has(key));
  if (matches.length === 1) {
    const match = matches[0];
    return presets[match];
  }

  return null;
}

/**
 * @returns {Preset}
 */
function get(name) {
  if (!name) {
    console.warn("No name given for preset resolution");
    return null;
  }
  name = name.replace("-", "_");
  const preset = presets[name];
  if (!preset) {
    console.warn(`Did not find preset ${name}`);
  }
  return preset;
}

export const Presets = Object.freeze({
  get,
  resolve,
});
