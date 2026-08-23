import FieldsetDataModel from "../../api/fieldset-data-model.mjs";

/**
 * Handles the management of engrams in an accessory.
 */
export default class EngramSlotsDataModel extends FieldsetDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }
}
