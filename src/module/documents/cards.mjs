/**
 * A simple extension that adds a hook at the end of data prep.
 */
export class AHCards extends foundry.documents.Cards {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHCards} cards      The cards preparing derived data.
     */
    Hooks.callAll("AH.prepareCardsData", this);
  }
}
