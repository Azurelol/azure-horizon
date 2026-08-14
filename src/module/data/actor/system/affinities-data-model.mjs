import { VersionedDataModel } from "../../api/_module.mjs";
import AffinityField from "./affinity-field.mjs";

/**
 * @property {AffinityField} physical
 * @remarks This is a set is later added into {@linkcode CharacterParametersDataModel}
 */
export default class AffinitiesDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      physical: new AffinityField(),
      slashing: new AffinityField(),
      piercing: new AffinityField(),
    });
  }
}
