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

  // BUFF
  conviction: { // Increased damage dealt and regen HP
    id: "conviction",
    name: "AH.STATUS.Conviction",
    img: "systems/azure-horizon/assets/icons/statuses/conviction.png",
  },
  defiance: { // Cannot be KOed
    id: "defiance",
    name: "AH.STATUS.Defiance",
    img: "systems/azure-horizon/assets/icons/statuses/defiance.png",
  },

  // HEALING
  regen: { // hp recovery each turn
    id: "regen",
    name: "AH.STATUS.Regen",
    img: "systems/azure-horizon/assets/icons/statuses/regen.png",
  },
  refresh: { // mp recovery each turn
    id: "refresh",
    name: "AH.STATUS.Refresh",
    img: "systems/azure-horizon/assets/icons/statuses/refresh.png",
  },

  malady: { // -50% healing
    id: "malady",
    name: "AH.STATUS.Malady",
    img: "systems/azure-horizon/assets/icons/statuses/malady.png",
  },

  // DEBUFF: Stacking
  fear: { // - checks and defenses
    id: "fear",
    name: "AH.STATUS.Fear",
    img: "systems/azure-horizon/assets/icons/statuses/fear.png",
  },
  sunder: { // + physical damage taken
    id: "sunder",
    name: "AH.STATUS.Sunder",
    img: "systems/azure-horizon/assets/icons/statuses/sunder.png",
  },
  breach: { // + magical damage taken
    id: "breach",
    name: "AH.STATUS.Breach",
    img: "systems/azure-horizon/assets/icons/statuses/breach.png",
  },
  heavy: { // -shift
    id: "heavy",
    name: "AH.STATUS.Heavy",
    img: "systems/azure-horizon/assets/icons/statuses/heavy.png",
  },

  // AP
  haste: { // +1 AP
    id: "haste",
    name: "AH.STATUS.Haste",
    img: "systems/azure-horizon/assets/icons/statuses/haste.png",
  },
  slow: { // -1 AP
    id: "slow",
    name: "AH.STATUS.Slow",
    img: "systems/azure-horizon/assets/icons/statuses/slow.png",
  },

  // CONTROL
  taunt: {
    id: "taunt",
    name: "AH.STATUS.Taunt",
    img: "systems/azure-horizon/assets/icons/statuses/taunt.png",
  },
  grab: {
    id: "grab",
    name: "AH.STATUS.Grab",
    img: "systems/azure-horizon/assets/icons/statuses/grab.png",
  },
  bind: {
    id: "bind",
    name: "AH.STATUS.Bind",
    img: "systems/azure-horizon/assets/icons/statuses/bind.png",
  },
  sleep: {
    id: "sleep",
    name: "AH.STATUS.Sleep",
    img: "systems/azure-horizon/assets/icons/statuses/sleep.png",
  },
  stun: {
    id: "stun",
    name: "AH.STATUS.Stun",
    img: "systems/azure-horizon/assets/icons/statuses/stun.png",
  },
  confusion: {
    id: "confusion",
    name: "AH.STATUS.Confusion",
    img: "systems/azure-horizon/assets/icons/statuses/confusion.png",
  },
  silence: {
    id: "silence",
    name: "AH.STATUS.Silence",
    img: "systems/azure-horizon/assets/icons/statuses/silence.png",
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
