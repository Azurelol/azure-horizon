
const { NumberField } = foundry.data.fields;

/**
 * Represents a character's resource (such as HP).
 * @property {Number} value The current value.
 * @property {Number} bonus A bonus value.
 */
export class ResourceDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      value: new NumberField({ initial: 10, min: 0, integer: true, nullable: false }),
      bonus: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
    };
  }
}
