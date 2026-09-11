import { VersionedDataModel } from "../../api/_module.mjs";
import { notifyInfo } from "../../../constants.mjs";
import { ObjectUtils } from "../../../utils/_module.mjs";

/**
 * @typedef {'mainHand'|'offHand'|'armor'|'accessory1'|'accessory2'} AH_InventorySlot
 */

/**
 * @property {String} mainHand
 * @property {String} offHand
 * @property {String} armor
 * @property {String} accessory1
 * @property {String} accessory2
 */
export default class InventoryDataModel extends VersionedDataModel {

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
      accessory1: new StringField({ nullable: true }),
      accessory2: new StringField({ nullable: true }),
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
   * @param {AH_InventorySlot} slot
   * @returns {InventoryDataModel} The changed item
   */
  toggleWeapon(item, slot) {
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

    const twoHanded = item.system.handedness === "two";
    if (twoHanded) {
      if (!unequipped.includes("mainHand")) {
        data.mainHand = item.id;
        data.offHand = item.id;
      }
    }
    else {
      switch (slot) {
        case "mainHand":
          if (!unequipped.includes("mainHand")) {
            data.mainHand = item.id;
          }
          break;
        case "offHand":
          if (!unequipped.includes("offHand")) {
            data.offHand = item.id;
          }
      }

    }

    return data;
  }

  get unlocked2() {
    return this.parent.level >= 20;
  }

  get unlocked3() {
    return this.parent.level >= 40;
  }

  get unlocked4() {
    return this.parent.level >= 60;
  }

  /**
   * @param {AHItem} item
   * @return {InventoryDataModel}
   */
  toggleArmor(item) {
    const data = this.toObject();
    if (data.armor === item.id) {
      data.armor = null;
    } else {
      data.armor = item.id;
    }
    return data;
  }

  /**
   * @param {AHItem} item
   * @param {'accessory1'|'accessory2'} slot
   * @return {InventoryDataModel}
   */
  toggleAccessory(item, slot) {
    const data = this.toObject();
    const unequipped = [];

    if (data[slot] === item.id) {
      data[slot] = null;
      unequipped.push(slot);
    } else {
      data[slot] = item.id;
    }

    switch (slot) {
      case "accessory1":
        if (data.accessory2 === item.id) {
          data.accessory2 = null;
        }
        break;
      case "accessory2":
        if (data.accessory1 === item.id) {
          data.accessory1 = null;
        }
        break;
    }
    return data;
  }

  /**
   * @param {AHItem} accessory
   * @param {AHItem} engram
   * @param index
   */
  async toggleEngram(accessory, engram, index) {
    notifyInfo(`Equipping ${engram.name} as an engram to accessory ${accessory.name} at index ${index}`);
    /** @type AccessoryDataModel **/
    const system = accessory.system;
    const entries = ObjectUtils.safeClone(
      system.slots.entries.map(e => (e.toObject ? e.toObject() : e)),
    );
    const existingIndex = entries.findIndex(e => e.item === engram.id);
    if (existingIndex !== -1) {
      entries[existingIndex].item = null;
    }
    if (index !== existingIndex) {
      entries[index].item = engram.id;
    }
    await accessory.update({
      "system.slots.entries": entries,
    });
  }
}
