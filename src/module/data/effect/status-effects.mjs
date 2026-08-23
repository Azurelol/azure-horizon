/**
 * System-specific status effects.
 * @type {Record<string, ActiveEffectData>}
 */
const STATUS_EFFECTS = Object.freeze({
  // HP
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

  // TARGETING
  stealth: {
    id: "stealth",
    name: "AH.STATUS.Stealth",
    img: "systems/azure-horizon/assets/icons/statuses/stealth.png",
  },

  // AFFINITY-BASED
  bleed: {
    id: "bleed",
    name: "AH.STATUS.Bleed",
    img: "systems/azure-horizon/assets/icons/statuses/bleed.png",
  },
  fracture: {
    id: "fracture",
    name: "AH.STATUS.Fracture",
    img: "systems/azure-horizon/assets/icons/statuses/fracture.png",
  },

  burn: {
    id: "burn",
    name: "AH.STATUS.Burn",
    img: "systems/azure-horizon/assets/icons/statuses/burn.png",
  },
  scorch: {
    id: "scorch",
    name: "AH.STATUS.Scorch",
    img: "systems/azure-horizon/assets/icons/statuses/scorch.png",
  },

  chill: {
    id: "chill",
    name: "AH.STATUS.Chill",
    img: "systems/azure-horizon/assets/icons/statuses/chill.png",
  },
  freeze: {
    id: "freeze",
    name: "AH.STATUS.Freeze",
    img: "systems/azure-horizon/assets/icons/statuses/freeze.png",
  },

  shock: {
    id: "shock",
    name: "AH.STATUS.Shock",
    img: "systems/azure-horizon/assets/icons/statuses/shock.png",
  },

  poison: {
    id: "poison",
    name: "AH.STATUS.Poison",
    img: "systems/azure-horizon/assets/icons/statuses/poison.png",
  },
  venom: {
    id: "venom",
    name: "AH.STATUS.Venom",
    img: "systems/azure-horizon/assets/icons/statuses/venom.png",
  },

  // PRESSURE
  pressure: {
    id: "pressure",
    name: "AH.STATUS.Pressure",
    img: "systems/azure-horizon/assets/icons/statuses/pressure.png",
  },
  stagger: {
    id: "stagger",
    name: "AH.STATUS.Stagger",
    img: "systems/azure-horizon/assets/icons/statuses/stagger.png",
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
