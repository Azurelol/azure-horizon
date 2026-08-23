import EquipmentDataModel from "./equipment-data-model.mjs";

/**
 * Represents a hero's accessory, which can grant them small benefits.
 * @property {AH_Rarity} rarity
 */
export default class AccessoryDataModel extends EquipmentDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }
}
