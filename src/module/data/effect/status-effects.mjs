/**
 * @typedef {'crisis'|'ko'|'stealth'|'charge'|'concentrate'|'sunder'|'breach'|'burn'|'scorch'|'chill'|'freeze'|'poison'|'venom'|'miasma'} AH_StatusEffect
 */

import { systemAssetPath } from "../../constants.mjs";

// TODO: Implement then use here due to needing to handle stacking, etc...

// NOTE: Duration is offset by 1, for SOT/EOT events.

const CONTROL_BUFF_DURATION = 1;
const DOT_DURATION = 2;
const SOFT_CONTROL_DURATION = 2;
const HARD_CONTROL_DURATION = 1;

const HARD_DEBUFF_DURATION = 1;
const PARAM_DEBUFF_DURATION = 1;
const STACK_DEBUFF_DURATION = 3;
const DAMAGE_BUFF_DURATION = 1;

class StatusDataBuilder {

  /** @type ActiveEffectData **/
  #data;

  constructor(id, name) {
    this.#data = {
      id: id,
      name: name,
      img: systemAssetPath(`icons/statuses/${id}.png`),
      system: {
        slug: id,
      },
    };
  }

  track(style, current, max) {
    this.#data.system.tracker = {
      id: this.#data.id,
      name: this.#data.name,
      style: style,
      enabled: true,
      current: current,
      max: max,
    };
    return this;
  }

  endOfTurn(turns) {
    this.#data.duration = {
      expiry: "turnEnd",
      units: "turns",
      value: turns,
    };
    return this;
  }

  startOfTurn(turns) {
    this.#data.duration = {
      expiry: "turnStart",
      units: "turns",
      value: turns,
    };
    return this;
  }

  hideIcon() {
    this.#data.showIcon = CONST.ACTIVE_EFFECT_SHOW_ICON.NEVER;
    return this;
  }

  endOfRound(rounds) {
    this.#data.duration = {
      expiry: "roundEnd",
      units: "rounds",
      value: rounds,
    };
    return this;
  }

  endOfCombat() {
    this.#data.duration = {
      expiry: "combatEnd",
      units: "rounds",
    };
    return this;
  }

  stack(track, duration) {
    this.#data.system.stacking = {
      track: track,
      duration: duration,
    };
    return this;
  }

  changes(entries) {
    this.#data.changes = entries;
    return this;
  }

  /**
   * @returns {ActiveEffectData}
   */
  build() {
    return this.#data;
  }
}

/**
 * System-specific status effects.
 * @type {Record<string, ActiveEffectData>}
 */
const STATUS_EFFECTS = Object.freeze({
  // HP
  peril: new StatusDataBuilder("peril", "AH.STATUS.PERIL").build(),
  crisis: new StatusDataBuilder("crisis", "AH.STATUS.Crisis").build(),
  ko: new StatusDataBuilder("ko", "AH.STATUS.KO").build(),
  defiance: new StatusDataBuilder("defiance", "AH.STATUS.Defiance")
    .startOfTurn(1)
    .build(),
  reprieve: new StatusDataBuilder("reprieve", "AH.STATUS.Reprieve")
    .build(),

  // TENSION
  stress: new StatusDataBuilder("stress", "AH.STATUS.Stress").track("stack", 1, 4).changes([
    {
      key: "system.parameters.check.all.status",
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: "-$tv",
    },
  ])
    .build(),

  // CONTROL
  // - can't use skills
  seal: new StatusDataBuilder("seal", "AH.STATUS.Seal")
    .endOfTurn(SOFT_CONTROL_DURATION)
    .build(),
  // - can't use spells
  mute: new StatusDataBuilder("mute", "AH.STATUS.Mute")
    .endOfTurn(SOFT_CONTROL_DURATION)
    .build(),
  // - can only attack, damage dealt/received up
  berserk: new StatusDataBuilder("berserk", "AH.STATUS.Berserk")
    .changes([
      {
        key: "system.parameters.damage.physical.outgoing.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "5",
      },
      {
        key: "system.parameters.damage.universal.incoming.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "10",
      },
    ])
    .endOfTurn(HARD_CONTROL_DURATION)
    .build(),
  // TARGETING
  taunt: new StatusDataBuilder("taunt", "AH.STATUS.Taunt")
    .startOfTurn(CONTROL_BUFF_DURATION)
    .build(),
  stealth: new StatusDataBuilder("stealth", "AH.STATUS.Stealth")
    .startOfTurn(CONTROL_BUFF_DURATION)
    .build(),
  stasis: new StatusDataBuilder("stasis", "AH.STATUS.Stasis")
    .startOfTurn(CONTROL_BUFF_DURATION)
    .build(),

  // BUFFS
  // - increased physical damage dealt
  strength: new StatusDataBuilder("strength", "AH.STATUS.Strength")
    .changes([
      {
        key: "system.parameters.damage.physical.outgoing.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "5",
      },
    ])
    .endOfTurn(DAMAGE_BUFF_DURATION)
    .build(),
  // - increased magical damage dealt
  concentration: new StatusDataBuilder("concentration", "AH.STATUS.Concentration")
    .changes([
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
    ])
    .endOfTurn(DAMAGE_BUFF_DURATION)
    .build(),

  // DEBUFFS
  // - increased all damage taken
  vulnerable: new StatusDataBuilder("vulnerable", "AH.STATUS.Vulnerable")
    .changes([
      {
        key: "system.parameters.damage.universal.incoming.status.multiplicative",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "1.25",
      },
    ])
    .endOfTurn(HARD_DEBUFF_DURATION)
    .build(),

  // - increased physical damage taken
  sunder: new StatusDataBuilder("sunder", "AH.STATUS.Sunder")
    .changes([
      {
        key: "system.parameters.damage.physical.incoming.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "2*$tv",
      },
    ])
    .track("bar", 1, 3)
    .stack(true, true)
    .endOfTurn(STACK_DEBUFF_DURATION)
    .build(),
  // - increased magical damage taken
  breach: new StatusDataBuilder("breach", "AH.STATUS.Breach")
    .changes([
      {
        key: "system.parameters.damage.elemental.incoming.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "2*$tv",
      },
      {
        key: "system.parameters.damage.spiritual.incoming.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "2*$tv",
      },
    ])
    .track("bar", 1, 3)
    .stack(true, true)
    .endOfTurn(STACK_DEBUFF_DURATION)
    .build(),
  // - reduced damage dealt
  weak: new StatusDataBuilder("weak", "AH.STATUS.Weak")
    .changes([
      {
        key: "system.parameters.damage.universal.outgoing.status.multiplicative",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "0.75",
      },
    ])
    .endOfTurn(PARAM_DEBUFF_DURATION)
    .build(),
  enfeeble: new StatusDataBuilder("enfeeble", "AH.STATUS.Enfeeble")
    .changes([
      {
        key: "system.parameters.damage.universal.outgoing.status.multiplicative",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "0.5",
      },
    ])
    .endOfTurn(HARD_DEBUFF_DURATION)
    .build(),
  // - reduced block
  frail: new StatusDataBuilder("frail", "AH.STATUS.Frail")
    .changes([
      {
        key: "system.parameters.block.bonus",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "-3*$tv",
      },
    ])
    .endOfTurn(PARAM_DEBUFF_DURATION)
    .build(),

  // AFFINITY-BASED
  bleed: new StatusDataBuilder("bleed", "AH.STATUS.Bleed")
    .endOfTurn(DOT_DURATION)
    .build(),
  fracture: new StatusDataBuilder("fracture", "AH.STATUS.Fracture")
    .build(),

  burn: new StatusDataBuilder("burn", "AH.STATUS.Burn")
    .track("stack", 1, 3)
    .stack(true, true)
    .endOfTurn(DOT_DURATION)
    .build(),
  scorch: new StatusDataBuilder("scorch", "AH.STATUS.Scorch")
    .changes([
      {
        key: "system.parameters.damage.fire.incoming.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "2*$tv",
      },
    ])
    .track("stack", 1, 3)
    .stack(true)
    .build(),

  chill: new StatusDataBuilder("chill", "AH.STATUS.Chill")
    .endOfTurn(DOT_DURATION)
    .changes([
      {
        key: "system.parameters.damage.cold.incoming.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "2*$tv",
      },
    ])
    .track("stack", 1, 3)
    .stack(true, true)
    .build(),
  freeze: new StatusDataBuilder("freeze", "AH.STATUS.Freeze")
    .endOfTurn(HARD_CONTROL_DURATION)
    .build(),

  shock: new StatusDataBuilder("shock", "AH.STATUS.Shock")
    .changes([
      {
        key: "system.parameters.checks.universal.status.additive",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "-$tv",
      },
    ])
    .track("stack", 1, 3)
    .stack(true, true)
    .endOfTurn(DOT_DURATION)
    .build(),
  paralysis: new StatusDataBuilder("paralysis", "AH.STATUS.Paralysis")
    .endOfTurn(HARD_CONTROL_DURATION)
    .build(),

  poison: new StatusDataBuilder("poison", "AH.STATUS.Poison")
    .endOfTurn(DOT_DURATION)
    .build(),
  venom: new StatusDataBuilder("venom", "AH.STATUS.Venom")
    .endOfTurn(DOT_DURATION)
    .build(),

  dazzle: new StatusDataBuilder("dazzle", "AH.STATUS.Dazzle")
    .endOfTurn(SOFT_CONTROL_DURATION)
    .build(),
  disjoint: new StatusDataBuilder("disjoint", "AH.STATUS.Disjoint")
    .endOfTurn(HARD_CONTROL_DURATION)
    .build(),

  // PRESSURE
  stagger: new StatusDataBuilder("stagger", "AH.STATUS.Stagger")
    .changes([
      {
        key: "system.parameters.damage.universal.incoming.situational.multiplicative",
        mode: CONST.ACTIVE_EFFECT_MODES.ADD,
        value: "1.5",
      },
    ])
    .build(),
  staggerResistance: new StatusDataBuilder("stagger-resistance", "AH.STATUS.StaggerResistance")
    .endOfCombat()
    .track("stack", 1, 3)
    .stack(true, true)
    .hideIcon()
    .build(),
  // TARGETING
  mark: new StatusDataBuilder("mark", "AH.STATUS.Mark").build(),

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
