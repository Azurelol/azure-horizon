import { ChatMessageBuilder } from "../helpers/_module.mjs";

/**
 * A simple extension that adds a hook at the end of data prep.
 * @property {AH_ItemType} type
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
   * Renders the item's description to HTML.
   *
   */
  async render() {
    const builder = new ChatMessageBuilder(this.parent, this);

    return builder.create();
  }
}
