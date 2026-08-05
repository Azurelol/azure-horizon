import { ChatMessageBuilder } from "../helpers/_module.mjs";
import DocumentMixin from "./document-mixin.mjs";
import { StringUtils } from '../utils/_module.mjs';
import { isActorType } from '../constants.mjs';

/**
 * A simple extension that adds a hook at the end of data prep.
 * @property {AH_ItemType} type
 * @property {ItemDataModel} system
 */
export class AHItem extends DocumentMixin(foundry.documents.Item) {

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHItem} item      The item preparing derived data.
     */
    Hooks.callAll("AH.prepareItemData", this);
  }

  /**
   * @param {KeyboardModifiers} modifiers
   * @returns {Promise<void>}
   */
  async perform(modifiers) {
    const performed = await this.system.perform();
    if (!performed) {
      await this.sendToChat();
    }
  }

  /**
   * Renders the item's description to HTML.
   */
  async sendToChat() {
    const builder = new ChatMessageBuilder(this.parent, this);
    return builder.create();
  }
}

Hooks.on('preCreateItem', (item, options, userId) => {
  // If the parent is an actor
  if (isActorType(item.parent)) {
    /** @type {AHActor} **/
    const actor = item.parent;
    // If the actor is NOT character type
    if (!actor.isCharacterType) {
      // Do not support effect creation on non-characters
      if (item.type === 'effect') {
        ui.notifications.error(`AH.WARNING.EffectsNotSupported`, { localize: true });
        return false;
      }
      // Only support white-listed item types
      if (!item.canStash) {
        ui.notifications.error(`FU.ActorSheetItemNotSupported`, { localize: true });
        return false;
      }
    }
  }

  // If no slug has been generated
  if (!item.system.slug && item.name) {
    // Generate FUID using the slugify utility
    const slug = StringUtils.slugify(item.name);
    if (slug) {
      item.updateSource({ 'system.slug': slug });
    } else {
      console.error('Slug generation failed for the item:', item.name, 'using slugify.');
    }
  }
});
