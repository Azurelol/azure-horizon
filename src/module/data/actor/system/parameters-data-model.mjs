import { VersionedDataModel } from "../../api/_module.mjs";

const HP_MIGHT_FACTOR = 5;
const MP_WILLPOWER_FACTOR = 5;

/**
 * @property {Number} value The current value of this parameter.
 * @property {Number} bonus Added to the maximum.
 * @property {Number} temporary Used as a buffer for some resources.
 */
export class ParameterDataModel extends VersionedDataModel {
  static defineSchema() {
    const { NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      value: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
      bonus: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
      temporary: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
    });
  }
}

/**
 * @property {ParameterDataModel} hp
 * @property {Number} hp.max
 * @property {ParameterDataModel} mp
 * @property {Number} mp.max
 */
export default class ParametersDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      hp: new EmbeddedDataField(ParameterDataModel, {}),
      mp: new EmbeddedDataField(ParameterDataModel, {}),
    });
  }

  /**
   * @param {ParameterDataModel} property
   * @param {Function} computeMaximum
   * @returns {*}
   */
  static defineMaximumProperty(property, computeMaximum) {
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
   * @param {Number} level
   * @param {Number} might
   * @returns {*}
   */
  static calculateHitPoints(level, might) {
    return (might * HP_MIGHT_FACTOR) + level;
  }

  /**
   * @param {Number} level
   * @param {Number} willpower
   * @returns {*}
   */
  static calculateMindPoints(level, willpower) {
    return (willpower * MP_WILLPOWER_FACTOR) + level;
  }

}
