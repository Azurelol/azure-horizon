import { VersionedDataModel } from "../../api/_module.mjs";
import { isActorType, notifyInfo } from "../../../constants.mjs";
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
   * @returns {AHActor}
   */
  get actor() {
    return this.parent.parent;
  }

  /**
   * @typedef EquippedItems
   * @property {AHItem} mainHand
   * @property {AHItem} offHand
   * @property {AHItem} armor
   * @property {AHItem} accessory1
   * @property {AHItem} accessory2
   * @property {AHItem[]} engrams
   */

  /**
   * @returns {EquippedItems}
   */
  get equipped() {
    const actor = this.actor;
    if (isActorType(actor)) {
      let equipped = {
        mainHand: actor.items.get(this.mainHand),
        offHand: actor.items.get(this.offHand),
        armor: actor.items.get(this.armor),
        accessory1: actor.items.get(this.accessory1),
        accessory2: actor.items.get(this.accessory2),
        engrams: [],
      };
      for (const acc of this.accessories) {
        for (const entry of acc.system.slots.entries) {
          if (entry.item) {
            equipped.engrams.push(entry.item);
          }
        }
      }
      return equipped;
    }
    return undefined;
  }

  /**
   * @returns {AHItem[]}
   */
  get accessories() {
    const accessories = [this.accessory1, this.accessory2].filter(Boolean);
    return accessories.map(id => this.actor.items.get(id));
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
    const updates = [];

    const entries = ObjectUtils.cloneArray(accessory.system.slots.entries);
    const existingIndex = entries.findIndex(e => e.item?._id === engram.id);

    if (existingIndex !== -1) {
      entries[existingIndex].item = null;
    }
    if (index !== existingIndex) {
      entries[index].item = engram.id;
    }
    updates.push({ _id: accessory.id, "system.slots.entries": entries });

    // Remove the entry from any other accessory currently holding this engram —
    // an engram can only be slotted in one place at a time.
    const others = this.accessories.filter(acc => acc.id !== accessory.id);
    for (const other of others) {
      const update = this._buildClearEngramUpdate(other, engram);
      if (update) updates.push(update);
    }

    await this.actor.updateEmbeddedDocuments("Item", updates);
  }

  /**
   * Builds an update payload clearing the given engram out of an accessory's
   * slots, or null if the accessory doesn't hold it.
   * @param {AHItem} accessory
   * @param {AHItem} engram
   * @returns {object|null}
   */
  _buildClearEngramUpdate(accessory, engram) {
    const entries = ObjectUtils.cloneArray(accessory.system.slots.entries);
    const index = entries.findIndex(e => e.item?._id === engram.id);
    if (index === -1) return null;

    entries[index].item = null;
    return { _id: accessory.id, "system.slots.entries": entries };
  }

}
