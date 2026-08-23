import EquipmentDataModel from "./equipment-data-model.mjs";
import EngramSlotsDataModel from "./fields/engram-slots-data-model.mjs";

/**
 * Represents a hero's accessory, which can grant them small benefits.
 * @property {AH_Rarity} rarity
 * @property {EngramSlotsDataModel} slots
 */
export default class AccessoryDataModel extends EquipmentDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      slots: new EmbeddedDataField(EngramSlotsDataModel, {}),
    });
  }
}
