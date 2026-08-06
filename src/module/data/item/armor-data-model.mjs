import ItemDataModel from "./item-data-model.mjs";

/**
 * Represents a hero's armor, which alters how they defend themselves.
 */
export default class ArmorDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {

    });
  }
}
