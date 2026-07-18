import { VersionedDataModel } from "../../api/_module.mjs";

/**
 * @property {AffinityDataModel} physical
 */
export default class AffinitiesDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }
}
