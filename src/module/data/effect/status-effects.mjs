/**
 * System-specific status effects.
 * @type {Record<string, ActiveEffectData>}
 */
const STATUS_EFFECTS = Object.freeze({
  crisis: {
    id: "crisis",
    name: "AH.STATUS.Crisis",
    img: "systems/azure-horizon/assets/icons/statuses/crisis.png",
  },
  ko: {
    id: "ko",
    name: "AH.STATUS.KO",
    img: "systems/azure-horizon/assets/icons/statuses/ko.png",
  },
  bleed: {
    id: "bleed",
    name: "AH.STATUS.Bleed",
    img: "systems/azure-horizon/assets/icons/statuses/bleed.png",
  },
  poison: {
    id: "poison",
    name: "AH.STATUS.Poison",
    img: "systems/azure-horizon/assets/icons/statuses/poison.png",
  },
  grab: {
    id: "grab",
    name: "AH.STATUS.Grab",
    img: "systems/azure-horizon/assets/icons/statuses/grab.png",
  },
});

const statusEffects = Object.freeze({
  /**
   * @type {Record<string, ActiveEffectData>}
   */
  entries: STATUS_EFFECTS,
  /**
   * @type {ActiveEffectData[]}
   */
  values: Object.values(STATUS_EFFECTS),
  /**
   * @param {String} id
   * @returns {boolean}
   */
  contains: (id) => {
    return id in STATUS_EFFECTS;
  },
});

export default statusEffects;
