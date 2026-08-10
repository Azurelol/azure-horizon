import VersionedDataModel from "./versioned-data-model.mjs";

/**
 * @inheritDoc VersionedDataModel
 */
export default class FieldsetDataModel extends VersionedDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { BooleanField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }

  /**
   * @returns {string} The system template path to the partial.
   */
  static get template() {
    throw Error("Template not implemented.");
  }
}
