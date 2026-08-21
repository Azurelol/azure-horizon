/**
 * @typedef ScalarModifier
 * @property {Boolean} enabled
 * @property {Number|String} amount
 * @property {String[]} traits
 */

/**
 * @typedef DamageUnit
 * @property {String|Number} amount
 * @property {AH_Grade} grade
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
 * @property {String} tooltip
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
   * @param {DamageUnit} unit
   * @returns {DamageData}
   */
  static construct(unit) {
    const data = new DamageData();
    data.add("AH.DAMAGE.Primary", unit);
    data.type = unit.type;
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
   * @param {DamageUnit} unit
   * @returns DamageData
   */
  add(label, unit) {
    this.custom({
      label: label,
      ...unit,
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
   * @param {AH_DamageType} type
   * @return {ParameterModifier[]}
   */
  resolve(type) {

    /** @type ParameterModifier[] **/
    let modifiers = [];

    const group = AH.damageTypes[type]?.group;
    const layers = ["universal", group, type].filter((key) => key && (key in this.modifiers));

    for (const key of layers) {
      const resolved = this.modifiers[key];
      if (!resolved || !resolved.length) continue;
      modifiers.push(...resolved);
    }

    return modifiers;
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
      inst.modifiers = this.resolve(inst.type) ?? [];
      inst.amount = Formulas.applyDamageModifiers(inst.amount, inst.modifiers);
      let tooltip = `${inst.addends.map(a => a).join(" + ")}`;
      if (inst.modifiers.length > 0) {
        for (const modifier of inst.modifiers) {
          if (modifier.additive) {
            tooltip += ` + ${modifier.additive}`;
          }
          if (modifier.multiplicative) {
            tooltip += ` * ${modifier.multiplicative}`;
          }
        }
      }
      inst.tooltip = tooltip;
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
      modifiers: active.map(a => a.modifiers).flat(),
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
