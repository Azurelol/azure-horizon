import { VersionedDataModel } from "../../api/_module.mjs";

/**
 * @property {Number} bonus
 * @property {Number} current
 */
export default class ParameterDataModel extends VersionedDataModel {
  static defineSchema() {
    const { NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      bonus: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
    });
  }

  /**
   * @param {Function} computeValue
   * @returns {void}
   */
  defineCurrentProperty(computeValue) {
    const property = this;
    Object.defineProperty(property, "current", {
      configurable: true,
      enumerable: true,
      get() {
        const computed = computeValue();
        const bonus = property.bonus;
        return computed + bonus;
      },
      set(newValue) {
        delete this.max;
        this.max = newValue;
      },
    });
  }
}
