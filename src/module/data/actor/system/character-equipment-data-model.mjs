import { VersionedDataModel } from "../../api/versioned-data-model.mjs";
import { isActorType } from "../../../constants.mjs";

/**
 * @typedef CharacterEquipmentData
 */

/**
 * Provides an interface for managing a character's equipment.
 */
export default class CharacterEquipmentDataModel extends VersionedDataModel {
  static defineSchema() {
    const { StringField } = foundry.data.fields;
    return {};
  }

  /**
   * @param {AHItem} item
   * @returns {boolean}
   */
  has(item) {
    return item && Object.values(this).includes(item?.id);
  }

  /**
   * @param {String} slot
   * @returns {AHItem}
   */
  get(slot) {
    const id = this[slot];
    if (id) {
      return this.actor.items.get(id);
    }
    return undefined;
  }

  /**
   * @returns {AHActor}
   */
  get actor() {
    return this.parent.parent;
  }

  /**
   * @returns {CharacterEquipmentData}
   */
  get equipped() {
    throw Error("Equipped property not implemented.");
  }

  /**
   * @param {AHItem} item
   * @param {String} slot
   * @return {Promise<Boolean>}
   */
  async toggleSlot(item, slot) {
    if (!isActorType(this.actor) || this.actor.system.equipment === undefined) {
      return false;
    }
    const data = this.toObject();
    if (data[slot] === item.id) {
      data[slot] = null;
    } else {
      data[slot] = item.id;
    }

    await this.actor.update({ "system.equipment": data });
    return true;
  }
}
