import VersionedDataModel from "./versioned-data-model.mjs";

/**
 * @property {Boolean} enabled
 */
export default class OptionalDataModel extends VersionedDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { BooleanField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      enabled: new BooleanField(),
    });
  }
}
