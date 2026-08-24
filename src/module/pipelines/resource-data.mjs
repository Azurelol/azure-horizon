import { MathUtils } from "../utils/_module.mjs";
import { scaleValue } from "../config.mjs";

/**
 * @class
 * @property {AH_Resource} type
 * @property {ScalarModifier[]} modifiers
 * @property {Boolean} temp Whether to affect the temporary pool for the resource.
 */
export default class ResourceData {
  static get baseModifier() {
    return "AH.COMMON.Base";
  }

  constructor(data = {}) {
    Object.assign(this, data);
    if (!this.modifiers) {
      this.modifiers = [];
    }
  }

  /**
   * @param {AH_Resource} type
   * @param {number} amount
   * @param {Boolean} temp
   * @returns {ResourceData}
   */
  static initialize(type, amount, temp) {
    const data = new ResourceData();
    data.addModifier(this.baseModifier, amount);
    data.temp = temp;
    data.type = type;
    return data;
  }

  /**
   * @param {String} label
   * @param {Number} amount
   */
  addModifier(label, amount) {
    /** @type ScalarModifier **/
    const modifier = {
      label: label ?? ResourceData.baseModifier,
      amount: this.type === "hp" ? scaleValue(amount) : amount,
      enabled: true,
    };
    this.modifiers.push(modifier);
  }

  /**
   * @returns {number}
   * @remark Does not evaluate expressions.
   */
  get total() {
    let result = 0;
    for (const mod of this.modifiers) {
      if (mod.enabled && mod.amount) {
        result += Number.parseInt(mod.amount);
      }
    }
    return result;
  }

  /**
   * @returns {String}
   */
  toString() {
    const parts = this.modifiers.map(m => {
      return m.amount;
    });
    return `${parts.join(" + ")}`;
  }

  /**
   * @returns {Boolean}
   */
  get isPositive() {
    for (const mod of this.modifiers) {
      if (MathUtils.resolveSign(mod.amount) < 0) {
        return false;
      }
    }
    return true;
  }
}
