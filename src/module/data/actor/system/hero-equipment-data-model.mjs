import { isActorType } from "../../../constants.mjs";
import { ObjectUtils } from "../../../utils/_module.mjs";
import CharacterEquipmentDataModel from "./character-equipment-data-model.mjs";

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
export default class HeroEquipmentDataModel extends CharacterEquipmentDataModel {
  static defineSchema() {
    const { StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      mainHand: new StringField({ nullable: true }),
      offHand: new StringField({ nullable: true }),
      armor: new StringField({ nullable: true }),
      accessory1: new StringField({ nullable: true }),
      accessory2: new StringField({ nullable: true }),
    });
  }

  /**
   * @typedef HeroEquipmentData
   * @property {AHItem} mainHand
   * @property {AHItem} offHand
   * @property {AHItem} armor
   * @property {AHItem} accessory1
   * @property {AHItem} accessory2
   * @property {AHItem[]} engrams
   */

  /**
   * @returns {HeroEquipmentData}
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
            equipped.engrams.push(actor.items.get(entry.item));
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
    return accessories.map(id => this.actor.items.get(id)).filter(Boolean);
  }

  /**
   * @param {AHItem} item
   * @param {AH_InventorySlot} slot
   * @returns {HeroEquipmentDataModel} The changed item
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

  get unlocked3() {
    return this.parent.level >= 40;
  }

  get unlocked4() {
    return this.parent.level >= 60;
  }

  /**
   * @param {AHItem} item
   * @return {HeroEquipmentDataModel}
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
   * @return {HeroEquipmentDataModel}
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
    const existingIndex = entries.findIndex(e => e.item === engram.id);

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

  /**
   * @param {AH_EngramKind} kind
   * @returns {EngramActionDataModel[]}
   */
  getEngramsOfKind(kind = "magic") {
    const equipped = this.equipped;
    const engrams = equipped.engrams.filter(e => e.system.kind === kind);
    const available = engrams.map(e => e.system.available).flat();
    return available;
  }

  /**
   * @param {(ArmorDataModel) => void} onArmor
   * @returns {HeroEquipmentDataModel}
   */
  withArmor(onArmor) {
    const equipped = this.equipped;
    if (equipped.armor) {
      onArmor(equipped.armor.system);
    }
    return this;
  }

}
