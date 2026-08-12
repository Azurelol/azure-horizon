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

  /**
   * The disposition for this combatant. In priority,
   * 1. Manually specified for this combatant
   * 2. Token disposition
   * 3. Prototype Token disposition for the associated actor
   * 4. -2.
   * @returns {number}
   */
  get disposition() {
    const disposition =
      this.system.disposition ??
      this.token?.disposition ??
      this.actor?.prototypeToken.disposition ??
      -2;
    if ((disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY) && this.hasPlayerOwner) return 2;
    return disposition;
  }

  /**
   * @returns {boolean}
   */
  get friendly() {
    return this.disposition === CONST.TOKEN_DISPOSITIONS.FRIENDLY;
  }

  /**
   * @returns {boolean}
   */
  get hostile() {
    return this.disposition === CONST.TOKEN_DISPOSITIONS.HOSTILE;
  }

  /** @override */
  _getInitiativeFormula() {
    // Fallback for combatants with no linked actor (e.g. bare tokens)
    if (!this.actor) return "1d20";

    return "1d@attributes.dex.current + 1d@attributes.ins.current + @parameters.init.current";
  }
}
