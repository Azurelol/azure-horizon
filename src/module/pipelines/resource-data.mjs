/**
 * @class
 * @property {String} type
 * @property {ScalarModifier[]} modifiers
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
   * @returns {DamageData}
   */
  static construct(type, amount) {
    const data = new ResourceData();
    data.addModifier(this.baseModifier, amount);
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
      amount: amount,
      enabled: true,
    };
    this.modifiers.push(modifier);
  }

  /**
   * @returns {number}
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
}
