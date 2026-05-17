/**
 * A simple extension that adds a hook at the end of data prep.
 */
export class AHActor extends foundry.documents.Actor {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHActor} actor      The actor preparing derived data.
     */
    Hooks.callAll("AH.prepareActorData", this);
  }
}
