import { VersionedDataModel } from "../../api/_module.mjs";

/**
 * @property {Number} value The current value of this parameter.
 * @property {Number} max Computed during initialization.
 * @property {Number} bonus Added to the maximum.
 * @property {Number} temporary Used as a buffer for some resources.
 */
export default class CharacterResourceDataModel extends VersionedDataModel {
  static defineSchema() {
    const { NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      value: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
      bonus: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
      temporary: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
    });
  }

  /**
   * @param {Function} computeMaximum
   * @returns {void}
   */
  defineMaximumProperty(computeMaximum) {
    const property = this;
    Object.defineProperty(property, "max", {
      configurable: true,
      enumerable: true,
      get() {
        const computed = computeMaximum();
        const bonus = property.bonus;
        return computed + bonus;
      },
      set(newValue) {
        delete this.max;
        this.max = newValue;
      },
    });
  }

  /**
   * @returns {number}
   */
  get half() {
    return Math.floor(this.max / 2);
  }
}
