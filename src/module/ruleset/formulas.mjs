const HP_MIGHT_FACTOR = 5;
const MP_WILLPOWER_FACTOR = 5;
const IP_BASE = 6;
const TP_BASE = 10;

export default class Formulas {
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
}
