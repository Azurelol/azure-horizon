import { VersionedDataModel } from "../../api/_module.mjs";

/**
 * Represents a character's affinity towards a type.
 */
export default class AffinityDataModel extends VersionedDataModel {
  static defineSchema() {
    const { NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      scalar: new NumberField({ integer: true, initial: 0 }),
      multiplier: new NumberField({ integer: false, initial: 1 }), // 100%
    });
  }
}
