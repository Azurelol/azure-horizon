import { VersionedDataModel } from "../../api/_module.mjs";

/**
 * @property {Number} value The current value of this parameter.
 * @property {Number} max Computed during initialization.
 * @property {Number} bonus Added to the maximum.
 * @property {Number} temporary Used as a buffer for some resources.
 */
export class ResourceDataModel extends VersionedDataModel {
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
}

/**
 * @property {Number} bonus
 * @property {Number} current
 */
export class ParameterDataModel extends VersionedDataModel {
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

/**
 * @property {ResourceDataModel} hp
 * @property {ResourceDataModel} mp
 * @property {ParameterDataModel} def
 * @property {ParameterDataModel} mdef
 */
export class BaseParametersDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      hp: new EmbeddedDataField(ResourceDataModel, {}),
      mp: new EmbeddedDataField(ResourceDataModel, {}),
      def: new EmbeddedDataField(ParameterDataModel, {}),
      mdef: new EmbeddedDataField(ParameterDataModel, {}),
    });
  }
}

/**
 * @property {ResourceDataModel} hp
 * @property {ResourceDataModel} mp
 * @property {ResourceDataModel} ip
 * @property {ResourceDataModel} tp
 * @property {ParameterDataModel} def
 * @property {ParameterDataModel} mdef
 */
export class CharacterParametersDataModel extends BaseParametersDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      ip: new EmbeddedDataField(ResourceDataModel, {}),
      tp: new EmbeddedDataField(ResourceDataModel, {}),
    });
  }
}
