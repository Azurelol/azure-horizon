/**
 * @typedef ScalarModifier
 * @property {Boolean} enabled
 * @property {Number|String} amount
 * @property {String[]} traits
 */

/**
 * @typedef DamageUnit
 * @property {String|Number} amount
 * @property {AH_DamageType} type
 *

/**
 * @typedef {DamageUnit} DamageComponent
 * @property {string} label
 * @property {Boolean} enabled
 * @property {String[]} traits These get concatenated.
 */

/**
 * @typedef DamageResolution
 * @property {Number} total
 * @property {DamageInstance[]} instances
 */

/**
 * @typedef DamageInstance The calculated damage instance.
 * @property {AH_DamageType} type
 * @property {Number} amount The sum total of addends and added modifiers.
 * @property {Number[]} addends
 * @property {ParameterModifier[]} modifiers
 * @property {String[]} traits
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
    data.add("AH.DAMAGE.Primary", type, amount);
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

    const found = this.modifiers[type].find(c => c.key === modifier.key);
    if (!found) {

    }

    this.modifiers[type].push(modifier);

    return this;
  }

  /**
   * @return {DamageInstance[]}
   */
  get instances() {
    /** @type {Map<AH_DamageType, DamageInstance>} **/
    const _instances = new Map();

    for (const component of this.components) {
      if (!component.enabled) continue;

      const amount = Number(component.amount) || 0;
      const traits = component.traits || [];

      if (!_instances.has(component.type)) {
        _instances.set(component.type, {
          amount,
          addends: [amount],
          type: component.type,
          traits: [...traits],
        });
        continue;
      }

      const existing = _instances.get(component.type);
      existing.amount += amount;
      existing.addends.push(amount);
      existing.traits.push(...traits);
    }

    // Apply modifiers
    let instances = [..._instances.values()];
    for (const inst of instances) {
      inst.modifiers = this.modifiers[inst.type] ?? [];
      inst.amount = Formulas.applyDamageModifiers(inst.amount, inst.modifiers);
    }
    return instances;
  }

  /**
   * @returns {DamageResolution}
   */
  get resolved() {
    const active = this.instances;
    const total = active.reduce((sum, inst) => sum + inst.amount, 0);
    return {
      total: total,
      instances: active,
    };
  }

  /**
   * @returns {string}
   */
  toString() {
    const totals = new Map();

    for (const inst of this.instances) {
      const amount = Number(inst.amount) || 0;
      totals.set(inst.type, (totals.get(inst.type) ?? 0) + amount);
    }

    const parts = Array.from(totals.entries())
      .map(([type, amount]) => {
        const icon = AH.icons[type];
        return `${amount}`;
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
