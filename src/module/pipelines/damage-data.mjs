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
 * @typedef DamageInstance The calculated damage instance.
 * @property {AH_DamageType} type
 * @property {Number} amount
 */

import { ObjectUtils, StringUtils } from "../utils/_module.mjs";
import AH from "../config.mjs";
import { Formulas } from "../ruleset/_module.mjs";

/**
 * Contains damage data used in pipelines.
 * @property {DamageComponent[]} components
 * @property {Record<AH_DamageType, ParameterModifier[]>} modifiers
 * @property {AH_DamageType} type The base damage type
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
   * @returns {DamageComponent} The base component.
   */
  get base() {
    return this.components[0];
  }

  /**
   * The damage types across components.
   * @returns {AH_DamageType[]}
   */
  get types() {
    return Array.from(new Set(this.components.map(c => c.type)));
  }

  /**
   * @param {DamageComponent} data
   * @returns DamageData
   */
  custom(data = {}) {
    this.components.push(data);
    return this;
  }

  /**
   * @param {String} label
   * @param {AH_DamageType} type
   * @param {String|Number} amount
   * @returns DamageData
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
   * Clear all components
   * @returns DamageData
   */
  clear() {
    this.components = [];
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
    const found = this.modifiers[type].find(c => c.label === modifier.label);
    if (!found) {
      this.modifiers[type].push(modifier);
    }
    return this;
  }

  /**
   * @param {DamageComponent} component
   * @returns {Number} The amount after applying modifiers for this component's type
   */
  _resolveComponentAmount(component) {
    const amount = Number(component.amount) || 0;
    const entries = this.modifiers[component.type] ?? [];
    const { additive, multiplicative } = Formulas.joinModifiers(entries);
    return (amount + additive) * multiplicative;
  }

  /**
   * @returns {Record<AH_DamageType, {additive: Number, multiplicative: Number}>}
   * Per-type joined modifiers, keyed the same way as {@linkcode modifiers}, for display use.
   */
  get modifierSummaries() {
    const summaries = {};
    for (const type of Object.keys(AH.damageTypes)) {
      summaries[type] = Formulas.joinModifiers(this.modifiers[type] ?? []);
    }
    return summaries;
  }

  /**
   * @returns {Number}
   */
  get total() {
    const active = this.components.filter((c) => c.enabled);
    return active.reduce((sum, component) => sum + this._resolveComponentAmount(component), 0);
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
