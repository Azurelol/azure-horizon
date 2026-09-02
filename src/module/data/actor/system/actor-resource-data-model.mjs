import { VersionedDataModel } from "../../api/_module.mjs";

/**
 * @property {Number} value The current value of this parameter.
 * @property {Number} max Computed during initialization.
 * @property {Number} bonus Added to the maximum.
 * @property {Number} temporary Used as a buffer for some resources.
 */
export default class ActorResourceDataModel extends VersionedDataModel {
  static defineSchema() {
    const { NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      value: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
      bonus: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
      temporary: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
      max: new NumberField({ persisted: false }),
    });
  }

  /**
   * @param {Function} computeMaximum
   * @returns {void}
   */
  defineMaximumProperty(computeMaximum) {
    const computed = computeMaximum();
    const bonus = this.bonus;
    this.max = computed + bonus;
  }

  /**
   * @returns {number}
   */
  get half() {
    return Math.floor(this.max / 2);
  }
}
