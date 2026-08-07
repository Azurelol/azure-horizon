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
 * @typedef DamageInstance
 * @property {AH_DamageType} type
 * @property {Number} amount
 */

import { ObjectUtils, StringUtils } from "../utils/_module.mjs";
import AH from "../config.mjs";

/**
 * Contains damage data used in pipelines.
 * @property {DamageComponent[]} components
 * @property {Record<AH_DamageType, ParameterModifier[]>} modifiers
 * @property {AH_DamageType} type The base damage type
 * @property {Boolean} useBase Whether to return the total damage without any modifiers.
 */
export default class DamageData {

  constructor(data = {}) {
    Object.assign(this, data);
    this.components ??= [];
    this.modifiers ??= {};
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
    return this;
  }

  /**
   * @param {AH_DamageType} type
   * @param {ParameterModifier} modifier
   */
  modify(type, modifier) {
    if (this.modifiers[type] === undefined) {
      this.modifiers[type] = [];
    }
    this.modifiers[type].push(modifier);
    return this;
  }

  /**
   * @returns {Number} The sum of all bonus damage modifiers ({@linkcode modifiers})
   */
  get componentTotal() {
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
    return this.componentTotal;
  }

  /**
   * The damage types across components.
   * @returns {AH_DamageType[]}
   */
  get types() {
    return Array.from(new Set(this.components.map(c => c.type)));
  }

  /**
   * @returns {string}
   */
  toString() {
    const totals = new Map();

    for (const component of this.components) {
      if (!component.enabled) {
        continue;
      }
      const amount = Number(component.amount) || 0;
      totals.set(component.type, (totals.get(component.type) ?? 0) + amount);
    }

    const parts = Array.from(totals.entries())
      .map(([type, amount]) => {
        const icon = AH.icons[type];
        return `${amount} <i class="ah-icon --xs ${icon}"></i>`;
      });

    return `${parts.join(" + ")}`;
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
