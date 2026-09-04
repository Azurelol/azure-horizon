import { ChatMessageBuilder, ChatMessageSections } from "../helpers/_module.mjs";
import DocumentMixin from "./document-mixin.mjs";
import { StringUtils } from "../utils/_module.mjs";
import { isActorType, systemAssetPath } from "../constants.mjs";

/**
 * A simple extension that adds a hook at the end of data prep.
 * @property {String} id
 * @property {String} img
 * @property {AH_ItemType} type
 * @property {ItemDataModel} system
 */
export class AHItem extends DocumentMixin(foundry.documents.Item) {

  static DEFAULT_ITEM_IMG = "icons/svg/item-bag.svg";

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
   * @returns {TrackerLookup}
   * @remarks Returns the first tracker in the item.
   */
  resolveTracker(id) {
    // Search among active effects in the item
    for (const effect of this.effects.values()) {
      if (effect.system.tracker?.enabled) {
        const tracker = effect.system.tracker;
        if ((id === this.system.slug) || (id === tracker.id)) {
          return {
            document: this,
            tracker: tracker,
          };
        }
      }
    }
    return undefined;
  }

  /**
   * @param {KeyboardModifiers} modifiers
   * @returns {Promise<void>}
   */
  async perform(modifiers) {
    // Only perform when equipped to an actor
    const performed = (this.parent !== undefined) && await this.system.perform();
    if (!performed) {
      await this.sendToChat();
    }
  }

  /**
   * Renders the item's description to HTML.
   */
  async sendToChat() {
    const builder = new ChatMessageBuilder(this.parent, this);
    if (this.system.description) {
      builder.text(this.system.description);
    }
    return builder.create();
  }
}

Hooks.on("preCreateItem", (item, options, userId) => {
  // If the parent is an actor
  if (isActorType(item.parent)) {
    /** @type {AHActor} **/
    const actor = item.parent;
    if (!actor.supportsItemType(item.type)) {
      ui.notifications.error("AH.DIALOG.WARNING.ItemNotSupported", { localize: true });
      return false;
    }
  }

  // TODO: Do the others too.
  // Use a default img for certain item types
  if (item.img === AHItem.DEFAULT_ITEM_IMG) {
    let img;
    switch (item.type) {
      case "skill":
      case "classFeature":
        img = systemAssetPath("icons/classes/skill_attack.png");
        break;
    }
    if (img) {
      item.updateSource({ img: img });

    }
  }

  // If no slug has been generated
  if (!item.system.slug && item.name) {
    // Generate slug using the slugify utility
    const slug = StringUtils.slugify(`${item.name}`);
    if (slug) {
      item.updateSource({ "system.slug": slug });
    } else {
      console.error("Slug generation failed for the item:", item.name, "using slugify.");
    }
  }
});
