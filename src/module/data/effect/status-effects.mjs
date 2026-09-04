/**
 * @typedef {'crisis'|'ko'|'stealth'|'charge'|'concentrate'|'sunder'|'breach'} AH_StatusEffect
 */

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

  // CONTROL
  // - can't use skills
  seal: {
    id: "seal",
    name: "AH.STATUS.Seal",
    img: "systems/azure-horizon/assets/icons/statuses/seal.png",
  },
  // - can't use spells
  mute: {
    id: "mute",
    name: "AH.STATUS.Mute",
    img: "systems/azure-horizon/assets/icons/statuses/mute.png",
  },
  // - can only attack, damage dealt/received up
  berserk: {
    id: "berserk",
    name: "AH.STATUS.Berserk",
    img: "systems/azure-horizon/assets/icons/statuses/berserk.png",
  },

  // TARGETING
  taunt: {
    id: "taunt",
    name: "AH.STATUS.Taunt",
    img: "systems/azure-horizon/assets/icons/statuses/taunt.png",
  },
  stealth: {
    id: "stealth",
    name: "AH.STATUS.Stealth",
    img: "systems/azure-horizon/assets/icons/statuses/stealth.png",
  },
  stasis: {
    id: "stasis",
    name: "AH.STATUS.Stasis",
    img: "systems/azure-horizon/assets/icons/statuses/stasis.png",
  },

  // BUFFS
  // - increased physical damage dealt
  strength: {
    id: "charge",
    name: "AH.STATUS.Strength",
    img: "systems/azure-horizon/assets/icons/statuses/charge.png",
    changes: [
      {
        key: "system.parameters.damage.physical.outgoing.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "5",
      },
    ],
  },
  // - increased magical damage dealt
  concentration: {
    id: "concentration",
    name: "AH.STATUS.Concentration",
    img: "systems/azure-horizon/assets/icons/statuses/concentration.png",
    changes: [
      {
        key: "system.parameters.damage.elemental.outgoing.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "5",
      },
      {
        key: "system.parameters.damage.spiritual.outgoing.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "5",
      },
    ],
  },

  // DEBUFFS
  // - increased all damage taken
  vulnerable: {
    id: "vulnerable",
    name: "AH.STATUS.Vulnerable",
    img: "systems/azure-horizon/assets/icons/statuses/vulnerable.png",
    changes: [
      {
        key: "system.parameters.damage.universal.incoming.status.multiplicative",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "1.25",
      },
    ],
    system: {
    },
  },
  // - increased physical damage taken
  sunder: {
    id: "sunder",
    name: "AH.STATUS.Sunder",
    img: "systems/azure-horizon/assets/icons/statuses/sunder.png",
    changes: [
      {
        key: "system.parameters.damage.physical.incoming.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "5",
      },
    ],
    system: {
    },
  },
  // - increased magical damage taken
  breach: {
    id: "breach",
    name: "AH.STATUS.Breach",
    img: "systems/azure-horizon/assets/icons/statuses/breach.png",
    changes: [
      {
        key: "system.parameters.damage.elemental.incoming.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "5",
      },
      {
        key: "system.parameters.damage.spiritual.incoming.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "5",
      },
    ],
  },
  // - reduced damage dealt
  weak: {
    id: "weak",
    name: "AH.STATUS.Weak",
    img: "systems/azure-horizon/assets/icons/statuses/weak.png",
    changes: [
      {
        key: "system.parameters.damage.universal.outgoing.status.multiplicative",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "0.75",
      },
    ],
  },
  // - reduced block
  frail: {
    id: "frail",
    name: "AH.STATUS.Frail",
    img: "systems/azure-horizon/assets/icons/statuses/frail.png",
    changes: [
      {
        key: "system.parameters.block.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "-5",
      },
    ],
    system: {
    },
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
    showIcon: false,
    system: {
      tracker: {
        enabled: true,
        name: "pressure",
        id: "pressure",
        current: 0,
        max: 4,
        style: "clock",
      },
    },
  },
  stagger: {
    id: "stagger",
    name: "AH.STATUS.Stagger",
    img: "systems/azure-horizon/assets/icons/statuses/stagger.png",
    changes: [
      {
        key: "system.parameters.damage.universal.incoming.situational.multiplicative",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "1.5",
      },
    ],
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
