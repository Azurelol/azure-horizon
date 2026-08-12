/**
 * A simple extension that adds a hook at the end of data prep.
 *
 */
export class AHCombatant extends foundry.documents.Combatant {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHCombatant} combatant      The combatant preparing derived data.
     */
    Hooks.callAll("AH.prepareCombatantData", this);
  }

  /** @override */
  _getInitiativeFormula() {
    // Fallback for combatants with no linked actor (e.g. bare tokens)
    if (!this.actor) return "1d20";

    return "1d@attributes.dex.current + 1d@attributes.ins.current + @parameters.init.current";
  }
}
