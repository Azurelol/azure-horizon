import { systemID } from "../../constants.mjs";
import Flags from "./flags.mjs";

/**
 * @description Lookup information for the source of an action.
 * @property {String} name
 * @property {String} itemUuid
 * @property {String} actorUuid
 * @property {String} effectUuid
 * @property {String} slug If an item is provided, used for referencing it from the compendium.
 */
export default class SourceInfo {
  constructor(name, actorUuid, itemUuid, effectUuid, slug) {
    this.name = name;
    this.actorUuid = actorUuid;
    this.itemUuid = itemUuid;
    this.effectUuid = effectUuid;
    this.slug = slug;
  }

  /**
   * @param {AHActor} actor
   * @param {AHItem} item
   * @param {String} name
   * @return {SourceInfo}
   */
  static fromInstance(actor, item, name = undefined) {
    if (actor) {
      if (item) {
        return new SourceInfo(name ?? item.name, actor.uuid, item.uuid);
      }
      return new SourceInfo(name ?? actor.name, actor.uuid, null);
    } else if (item) {
      return new SourceInfo(name ?? item.name, null, item.uuid);
    }
  }

  /**
   * @param {String} slug
   * @returns {SourceInfo}
   */
  withSlug(slug) {
    this.slug = slug;
    return this;
  }

  /**
   * @param {String} actorUuid
   * @param {String} itemUuid
   * @return {SourceInfo}
   */
  static resolveName(actorUuid, itemUuid) {
    const resolvedModel = fromUuidSync(itemUuid ?? actorUuid);
    return new SourceInfo(resolvedModel.name, actorUuid, itemUuid);
  }

  /**
   * @description Used for reconstruction during deserialization
   * @param {Object} obj An object containing the properties of this class
   * @returns {SourceInfo}
   */
  static fromObject(obj) {
    return new SourceInfo(obj.name, obj.actorUuid, obj.itemUuid);
  }

  /**
   * @param message
   * @returns {SourceInfo}
   */
  static fromChatMessage(message) {
    const info = message.getFlag(systemID, Flags.ChatMessage.Source);
    if (info) {
      return new SourceInfo(info.name, info.actorUuid, info.itemUuid);
    }
    return null;
  }

  /**
   * @returns {AHActor|null}
   */
  resolveActor() {
    if (this.actorUuid) {
      return fromUuidSync(this.actorUuid);
    }
    return null;
  }

  /**
   * @returns {AHItem|null}
   */
  resolveItem() {
    if (this.itemUuid) {
      return fromUuidSync(this.itemUuid);
    }
    return null;
  }

  /**
   * @returns {AHActiveEffect|null}
   */
  resolveEffect() {
    if (this.effectUuid) {
      return fromUuidSync(this.effectUuid);
    }
    return null;
  }

  /**
   * @returns {AHActor|AHItem}
   */
  resolve() {
    if (this.actorUuid) {
      return fromUuidSync(this.actorUuid);
    }
    if (this.itemUuid) {
      return fromUuidSync(this.itemUuid);
    }
    return null;
  }

  /**
   * @returns {String} The uuid of the item, or the actor
   */
  get uuid() {
    if (this.itemUuid) {
      return this.itemUuid;
    }
    return this.actorUuid;
  }

  /**
   * @returns {Boolean}
   */
  get hasEffect() {
    return !!this.effectUuid;
  }

  /**
   * @returns {Boolean}
   */
  get hasItem() {
    return !!this.itemUuid;
  }

  static none = Object.freeze(new SourceInfo("AH.COMMON.Unknown"));

  /**
   * @desc Used to refer to the scene of a conflict.
   * @type {Readonly<SourceInfo>}
   */
  static scene = Object.freeze(new SourceInfo("AH.COMMON.Scene"));
}
