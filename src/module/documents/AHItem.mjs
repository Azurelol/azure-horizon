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
}
