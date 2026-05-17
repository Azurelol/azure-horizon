/**
 * A simple extension that adds a hook at the end of data prep.
 */
export class AHUser extends foundry.documents.User {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHUser} user      The user preparing derived data.
     */
    Hooks.callAll("AH.prepareUserData", this);
  }
}
