import { VersionedDataModel } from "../../api/_module.mjs";

/**
 * @property {String} mainHand
 * @property {String} offHand
 * @property {String} armor
 */
export default class EquipmentDataModel extends VersionedDataModel {

  /**
   * @type {Set<AH_ItemType>}
   */
  static EQUIPMENT_TYPES = new Set(["accessory", "armor", "shield", "weapon"]);

  static defineSchema() {
    const { ArrayField, StringField } = foundry.data.fields;
    return {
      mainHand: new StringField({ nullable: true }),
      offHand: new StringField({ nullable: true }),
      armor: new StringField({ nullable: true }),
    };
  }

  /**
   * @param {AHItem} item
   * @returns {boolean}
   */
  has(item) {
    return item && Object.values(this).includes(item?.id);
  }

  /**
   * @param {AHItem} item
   * @returns {EquipmentDataModel} The changed item
   */
  toggleWeapon(item) {
    const unequipped = [];
    const data = this.toObject();
    if (this.mainHand === item.id) {
      data.mainHand = null;
      unequipped.push("mainHand");
    }
    if (this.offHand === item.id) {
      data.offHand = null;
      unequipped.push("offHand");
    }

    // 2-HAND
    if (!unequipped.includes("mainHand")) {
      data.mainHand = item.id;
      data.offHand = item.id;
    }
    // 1-HAND
    else {
    }

    return data;
  }
}
