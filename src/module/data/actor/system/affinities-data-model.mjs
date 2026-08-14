import { VersionedDataModel } from "../../api/_module.mjs";
import { ModifierDataField } from "../../api/modifiers.mjs";

/**
 * @property {AffinityDataModel} physical
 * @remarks This is a set is later added into {@linkcode CharacterParametersDataModel}
 */
export default class AffinitiesDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      physical: new ModifierDataField(),
      slashing: new ModifierDataField(),
      piercing: new ModifierDataField(),
    });
  }
}
