import AH from "../config.mjs";
import { systemID } from "../constants.mjs";
import { PartySheet } from "../apps/actor/_module.mjs";
import Pressure from "../pipelines/pressure.mjs";

/**
 * @typedef {'hero'|'adversary'} AH_Faction
 */

/**
 * A simple extension that adds a hook at the end of data prep.
 * @property {AHActor} actor
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
   * @override
   */
  async _onCreate(createData, options, userId) {
    if (userId !== game.user.id) return;

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
   * @return {AH_Faction}
   */
  get faction() {
    return this.friendly ? "hero" : "adversary";
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

  /**
   * @param {IntentAction} intent
   */
  setIntent(intent) {
    this.setFlag(systemID, AH.flags.Combatant.Intent, intent);
  }

  /**
   * @returns {IntentAction|undefined}
   * @remarks Fetched by the combat tracker.
   */
  get intent() {
    /** @type IntentAction **/
    let intent = this.getFlag(systemID, AH.flags.Combatant.Intent);
    if (intent === undefined) {
      intent = {
        type: "unknown",
        item: "",
        targets: "",
      };
    }
    intent.icon = AH.intents[intent.type].icon;
    return intent;
  }

}
