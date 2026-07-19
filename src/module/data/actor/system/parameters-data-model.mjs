import { VersionedDataModel } from "../../api/_module.mjs";

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
 */
export default class ParametersDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      hp: new EmbeddedDataField(ParameterDataModel, {}),
    });
  }

  /**
   * @param {Number} level
   * @param {Number} might
   * @param {Number} willpower
   * @returns {*}
   */
  static calculateHitPoints(level, might, willpower) {
    return might * 5 + level;
  }

}
