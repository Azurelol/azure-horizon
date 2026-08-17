// CHARACTERS
const HP_MIGHT_FACTOR = 5;
const MP_WILLPOWER_FACTOR = 5;
const IP_BASE = 6;
const TP_BASE = 10;
const MIN_ATTRIBUTE_DIE = 4;
const MAX_ATTRIBUTE_DIE = 12;
// FOLLOWERS
const HP_LEVEL_FACTOR = 5;

/**
 * @typedef Modifier
 * @property {Number} additive Should default to 0.
 * @property {Number} multiplicative Should default to 1.
 * @property {Boolean} valid It's valid if it's not at default values.
 */

/**
 * @typedef {Modifier} ParameterModifier
 * @property {AH_Modifier} key
 */

export default class Formulas {

  static CRITICAL_THRESHOLD = MIN_ATTRIBUTE_DIE;

  /**
   * @param {EntityDataModel} system
   * @returns {Number}
   */
  static calculateHitPoints(system) {
    const actor = system.parent;
    switch (actor.type) {
      case "hero":
      case "adversary": {
        /** @type AttributesDataModel **/
        const attributes = system.attributes;
        return (attributes.mig.base * HP_MIGHT_FACTOR) + system.level;
      }

      case "follower":
      case "guest":
        return system.level * HP_LEVEL_FACTOR;

      case "unit":
        break;
    }
    // TODO: Throw?
    return 0;
  }

  /**
   * @param {Number} level
   * @param {Number} willpower
   * @returns {Number}
   */
  static calculateMindPoints(level, willpower) {
    return (willpower * MP_WILLPOWER_FACTOR) + level;
  }

  /**
   * @returns {Number}
   */
  static calculateInventoryPoints() {
    return IP_BASE;
  }

  /**
   * @returns {Number}
   */
  static calculateTensionPoints() {
    return TP_BASE;
  }

  /**
   * @param {AttributesDataModel} attributes
   * @returns {Number}
   */
  static calculateDefense(attributes) {
    return this.round((attributes.dex.current + attributes.mig.current) / 2);
  }

  /**
   * @param {AttributesDataModel} attributes
   * @returns {Number}
   */
  static calculateMagicDefense(attributes) {
    return this.round((attributes.wlp.current + attributes.ins.current) / 2);
  }

  /**
   * @param {AttributesDataModel} attributes
   * @returns {Number}
   */
  static calculateInitiative(attributes) {
    return this.round((attributes.dex.current + attributes.ins.current) / 2);
  }

  /**
   * @param {ParameterModifier[]} modifiers
   * @return {Modifier}
   */
  static joinModifiers(modifiers) {
    let _additive = 0;
    let _multiplicative = 1;

    for (const { key, additive, multiplicative } of modifiers) {
      if (additive) {
        _additive += additive;
      }
      if (_multiplicative) {
        _multiplicative *= multiplicative;
      }
    }

    return { additive: _additive, multiplicative: _multiplicative, valid: (_additive !== 0) && (_multiplicative !== 1) };
  }

  /**
   * @param {Number} amount
   * @return {Number}
   */
  static round(amount) {
    return Math.round(amount);
  }

  /** @type {Record<string, {attacker: AH_Potency, defense: AH_Potency}>} */
  static #POTENCY_BY_OUTCOME = {
    critical: { attacker: "powerful", defense: "reduced" },
    fumble: { attacker: "reduced", defense: "powerful" },
    success: { attacker: "standard", defense: "reduced" },
    failure: { attacker: "reduced", defense: "standard" },
  };

  /**
   * @param {CheckResult} check
   * @param {Number} difficulty
   * @param {Boolean} defense
   * @return {AH_Potency}
   */
  static calculatePotency(check, difficulty, defense = false) {
    const outcome = check.critical
      ? "critical"
      : check.fumble
        ? "fumble"
        : check.total >= difficulty
          ? "success"
          : "failure";

    return this.#POTENCY_BY_OUTCOME[outcome][defense ? "defense" : "attacker"];
  }

  /**
   * @param {Number} amount
   * @param {ParameterModifier[]} modifiers
   */
  static applyDamageModifiers(amount, modifiers) {
    const { additive, multiplicative } = Formulas.joinModifiers(modifiers);
    return Formulas.round((amount + additive) * multiplicative);
  }
}
