import { ChatMessageBuilder } from "../helpers/_module.mjs";

/**
 * A simple extension that adds a hook at the end of data prep.
 * @property {AH_ItemType} type
 * @property {DataModel} system
 */
export class AHItem extends foundry.documents.Item {
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
    if (this.system.perform instanceof Function) {
    }
    else {
      return this.sendToChat();
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
