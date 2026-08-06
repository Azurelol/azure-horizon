import ItemDataModel from "./item-data-model.mjs";

/**
 * Represents a hero's accessory, which can grant them small benefits.
 */
export default class AccessoryDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }
}
