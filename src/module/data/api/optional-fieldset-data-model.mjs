import FieldsetDataModel from "./fieldset-data-model.mjs";

/**
 * @inheritDoc OptionalDataModel
 * @property {Boolean} enabled
 */
export default class OptionalFieldsetDataModel extends FieldsetDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { BooleanField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      enabled: new BooleanField(),
    });
  }
}
