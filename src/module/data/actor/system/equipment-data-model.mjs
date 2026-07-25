import { VersionedDataModel } from "../../api/_module.mjs";

/**
 * @property {string} mainHand
 * @property {string} offHand
 */
export default class EquipmentDataModel extends VersionedDataModel {

  /**
   * @type {Set<AH_ItemType>}
   */
  static EQUIPMENT_TYPES = new Set(["accessory", "armor", "shield", "weapon", "customWeapon"]);

  static defineSchema() {
    const { ArrayField, StringField } = foundry.data.fields;
    return {
      mainHand: new StringField({ nullable: true }),
      offHand: new StringField({ nullable: true }),
    };
  }
}
