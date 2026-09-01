import FieldsetDataModel from "./fieldset-data-model.mjs";

/**
 * @inheritDoc OptionalDataModel
 * @property {Boolean} enabled
 * @property {Boolean} required If set externally, will treat the fieldset as being enabled by default and prevent toggling.
 */
export default class OptionalFieldsetDataModel extends FieldsetDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { BooleanField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      enabled: new BooleanField(),
    });
  }

  /**
   * @returns {Boolean} True if enabled or required.
   */
  get active() {
    return this.enabled || this.required;
  }
}
