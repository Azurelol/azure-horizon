import { VersionedDataModel } from "../../api/_module.mjs";
import { MathUtils } from "../../../utils/_module.mjs";
import AH from "../../../config.mjs";

/**
 * Represents an attribute die for a character.
 * @property {Number} base The base die, adjusted by level.
 * @property {Number} bonus A bonus to the current attribute, modified through AEs.
 */
export default class AttributeDataModel extends VersionedDataModel {

  static defineSchema() {
    const { NumberField } = foundry.data.fields;
    return {
      base: new NumberField({ initial: AH.defaults.attribute.min,
        min: AH.defaults.attribute.min,
        max: AH.defaults.attribute.max,
        integer: true, nullable: false, validate: MathUtils.isEven }),
      bonus: new NumberField({ integer: true, initial: 0 }),
    };
  }

  /**
   * @returns {number} The sum of the base and bonus.
   */
  get current() {
    return this.base + this.bonus;
  }

  constructor(data, options) {
    super(data, options);
  }
}
