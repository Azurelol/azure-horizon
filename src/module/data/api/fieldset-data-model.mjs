import OptionalDataModel from "./optional-data-model.mjs";

/**
 * @inheritDoc OptionalDataModel
 */
export default class FieldsetDataModel extends OptionalDataModel {
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
