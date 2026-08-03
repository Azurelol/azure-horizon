/**
 * A simple extension that adds a hook at the end of data prep.
 */
export class AHCard extends foundry.documents.Card {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHCard} card      The card preparing derived data.
     */
    Hooks.callAll("AH.prepareCardData", this);
  }
}
