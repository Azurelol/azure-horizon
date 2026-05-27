/**
 * A simple extension that adds a hook at the end of data prep.
 * @property {AHActorType} type
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

  static migrateData(source) {
    source = super.migrateData(source);
    if (source.type === "basic") {
      source.type = "base";
    }
    return source;
  }
}
