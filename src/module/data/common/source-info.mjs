import { systemID } from "../../constants.mjs";
import Flags from "./flags.mjs";
import { FoundryUtils, StringUtils } from "../../utils/_module.mjs";

/**
 * @description Lookup information for the source of an action.
 * @property {String} name
 * @property {String} itemUuid
 * @property {String} actorUuid
 * @property {String} effectUuid
 * @property {String} slug If an item is provided, used for referencing it from the compendium.
 */
export default class SourceInfo {

  /**
   * @desc Used for cases where there is no possible source.
   * @type {Readonly<SourceInfo>}
   */
  static none = Object.freeze(new SourceInfo("AH.COMMON.Unknown"));

  /**
   * @desc Used to refer to the scene of a conflict.
   * @type {Readonly<SourceInfo>}
   */
  static scene = Object.freeze(new SourceInfo("AH.COMMON.Scene"));

  constructor(name, actorUuid, itemUuid, effectUuid, slug) {
    this.name = name;
    this.actorUuid = actorUuid;
    this.itemUuid = itemUuid;
    this.effectUuid = effectUuid;
    this.slug = slug;
  }

  /**
   * @param {Document} document
   * @returns {boolean}
   */
  static isActor(document) {
    return document?.constructor?.name === "AHActor";
  }

  /**
   * @param {Document} document
   * @returns {boolean}
   */
  static isItem(document) {
    return document?.constructor?.name === "AHItem";
  }

  /**
   * @description Attempts to determine the item/actor source within an html element
   * @param {Document} document
   * @param {HTMLElement} element
   * @returns {SourceInfo}
   */
  static resolve(document, element) {
    let name = StringUtils.localize("AH.COMMON.Unknown");
    let itemUuid = null;
    let actorUuid = null;
    let effectUuid = null;
    let slug = element?.dataset?.slug;

    // ACTOR SHEET
    if (SourceInfo.isActor(document)) {
      actorUuid = document.uuid;
      console.debug(`Determining source document as Actor ${actorUuid}`);
      const itemElement = element.closest("[data-item-id]");
      const itemId = itemElement?.dataset.itemId;
      if (itemId) {
        let item = document.items.get(itemId);
        if (!item) {
          const uuid = itemElement.dataset.uuid;
          if (uuid) {
            item = fromUuidSync(uuid);
          }
        }
        if (item) {
          itemUuid = item.uuid;
          slug ??= item.system.slug;
          name = item.name;
        }
      } else {
        name = document.name;
      }
      const effectElement = element.closest("[data-effect-id]");
      const effectId = effectElement?.dataset.effectId;
      if (effectId) {
        let effect = document.effects.get(effectId);
        if (!effect) {
          const uuid = effectElement.dataset.uuid;
          if (uuid) {
            effect = fromUuidSync(uuid, { strict: false });
          }
        }
        if (effect) {
          effectUuid = effect.uuid;
          slug ??= effect.system.slug;
          name = effect.name;
        }
      }
    } // ITEM SHEET
    else if (SourceInfo.isItem(document)) {
      name = document.name;
      itemUuid = document.uuid;
      slug ??= document.system.slug;
      if (document.isEmbedded) {
        actorUuid = document.actor.uuid;
      }
      console.debug(`Determining source document as Item ${itemUuid}`);
    }
    // CHAT MESSAGE
    else if (document instanceof ChatMessage) {
      const speakerActor = ChatMessage.getSpeakerActor(document.speaker);
      if (speakerActor) {
        actorUuid = speakerActor.uuid;
        name = speakerActor.name;
      }
      // If an item reference was provided
      const item = document.getFlag(systemID, Flags.ChatMessage.Item);
      if (item) {
        if (FoundryUtils.isUUID(item)) {
          itemUuid = item;
        } else {
          // It's possible the dispatcher didn't encode this information
          if (item.name) {
            name = item.name;
          }
          itemUuid = item.uuid;
        }
      }
      // Get the item from the check data
      else {
        const check = document.getFlag(systemID, Flags.ChatMessage.Check);
        if (check) {
          itemUuid = check.itemUuid;
          if (check.itemName) {
            name = check.itemName;
          }
        }
      }
      // Could come from an effect
      const effect = document.getFlag(systemID, Flags.ChatMessage.Effect);
      if (effect) {
        effectUuid = effect;
      }
      console.debug(`Determining source document as ChatMessage ${name}`);
    }

    // TODO: Figure out which case triggers this
    // FALLBACK
    if (element) {
      const chatItemText = element.closest("#chat-item-text");
      if (chatItemText) {
        if (chatItemText.dataset.actorUuid) {
          itemUuid = chatItemText.dataset.actorUuid;
        }
        if (chatItemText.dataset.itemId) {
          itemUuid = chatItemText.dataset.itemId;
        }
      }
    }
    return new SourceInfo(name, actorUuid, itemUuid, effectUuid, slug);
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
}
