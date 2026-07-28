/**
 * @typedef ScalarModifier
 * @property {Boolean} enabled
 * @property {Number|String} amount
 * @property {String[]} traits
 */

/**
 * @typedef DamageComponent
 * @property {string} label
 * @property {Boolean} enabled
 * @property {String|Number} amount
 * @property {AH_DamageType} type
 * @property {String[]} traits
 */

/**
 * @typedef DamageBonus
 * @property {Number} increment Should default to 0.
 * @property {Number} multiplier Should default to 1.
 */

/**
 * Contains damage data used in pipelines.
 * @property {DamageComponent[]} components
 * @property {Number} hr The high roll
 */
export default class DamageData {

  constructor(data = {}) {
    Object.assign(this, data);
    this.components ??= [];
    this.hr ??= 0;
  }

  /**
   * @param {DamageComponent} data
   */
  custom(data = {}) {
    this.components.push(data);
  }

  /**
   * @param {AH_DamageType} type
   * @param {String|Number} amount
   */
  add(type, amount) {
    this.custom({
      type: type,
      amount: amount,
      enabled: true,
    });
  }
}
