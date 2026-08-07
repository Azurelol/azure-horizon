const HP_MIGHT_FACTOR = 5;
const MP_WILLPOWER_FACTOR = 5;
const IP_BASE = 6;
const TP_BASE = 10;
const MIN_ATTRIBUTE_DIE = 4;
const MAX_ATTRIBUTE_DIE = 12;

/**
 * @typedef Modifier
 * @property {Number} additive Should default to 0.
 * @property {Number} multiplicative Should default to 1.
 */

/**
 * @typedef {Modifier} ParameterModifier
 * @property {String} label
 */

export default class Formulas {

  static CRITICAL_THRESHOLD = MIN_ATTRIBUTE_DIE;

  /**
   * @param {Number} level
   * @param {Number} might
   * @returns {Number}
   */
  static calculateHitPoints(level, might) {
    return (might * HP_MIGHT_FACTOR) + level;
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
    return attributes.dex.current;
  }

  /**
   * @param {AttributesDataModel} attributes
   * @returns {Number}
   */
  static calculateMagicDefense(attributes) {
    return attributes.ins.current;
  }

  /**
   * @param {ParameterModifier[]} modifiers
   * @return {Modifier}
   */
  static joinModifiers(modifiers) {
    let _additive = 0;
    let _multiplicative = 1;

    for (const { additive, multiplicative } of modifiers) {
      _additive += additive;
      _multiplicative *= multiplicative;
    }

    return { additive: _additive, multiplicative: _multiplicative };
  }

  /**
   * @param {Number} amount
   * @param {ParameterModifier} modifier
   */
  static modifyDamage(amount, modifier) {
  }
}
