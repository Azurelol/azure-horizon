/**
 * A simple extension that adds a hook at the end of data prep.
 */
export class AHActiveEffect extends foundry.documents.ActiveEffect {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHActiveEffect} effect      The effect preparing derived data.
     */
    Hooks.callAll("AH.prepareActiveEffectData", this);
  }
}
