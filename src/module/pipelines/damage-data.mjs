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
 * @property {String[]} traits These get concatenated.
 */

/**
 * @typedef DamageBonus
 * @property {Number} increment Should default to 0.
 * @property {Number} multiplier Should default to 1.
 */

import { ObjectUtils } from "../utils/_module.mjs";

/**
 * Contains damage data used in pipelines.
 * @property {DamageComponent[]} components
 * @property {AH_DamageType} type The base damage type
 * @property {Boolean} useBase Whether to return the total damage without any modifiers.
 */
export default class DamageData {

  constructor(data = {}) {
    Object.assign(this, data);
    this.components ??= [];
  }

  /**
   * @param {AH_DamageType} type
   * @param {String|Number} amount
   * @returns {DamageData}
   */
  static construct(type, amount) {
    const data = new DamageData();
    data.add("AH.DAMAGE.Base", type, amount);
    data.type = type;
    return data;
  }

  /**
   * @returns {DamageComponent}
   */
  get base() {
    return this.components[0];
  }

  /**
   * @param {DamageComponent} data
   */
  custom(data = {}) {
    this.components.push(data);
  }

  /**
   * @param {String} label
   * @param {AH_DamageType} type
   * @param {String|Number} amount
   */
  add(label, type, amount) {
    this.custom({
      label: label,
      type: type,
      amount: amount,
      enabled: true,
    });
  }

  /**
   * @returns {Number} The sum of all bonus damage modifiers ({@linkcode modifiers})
   */
  get modifierTotal() {
    if (this.useBase) {
      return this.base.amount;
    }
    return this.base.amount + this.components.slice(1).reduce((agg, curr) => agg + curr.amount, 0);
  }

  /**
   * Removes all modifiers from the data.
   */
  removeModifiers() {
    this.components = this.components.slice(1);
  }

  /**
   * @returns {Number}
   */
  get total() {
    return this.modifierTotal;
  }

  /**
   * The damage types across components.
   * @returns {AH_DamageType[]}
   */
  get types() {
    return Array.from(new Set(this.components.map(c => c.type)));
  }

  /**
   * @param {(data: DamageData) => void} config
   * @return {DamageData}
   */
  duplicate(config) {
    const copy = new DamageData(ObjectUtils.duplicate(this));
    config(copy);
    return copy;
  }
}
