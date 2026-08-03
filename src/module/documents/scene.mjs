/**
 * A simple extension that adds a hook at the end of data prep.
 */
export class AHScene extends foundry.documents.Scene {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHScene} scene      The scene preparing derived data.
     */
    Hooks.callAll("AH.prepareSceneData", this);
  }
}
