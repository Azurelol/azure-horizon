import { systemPath, systemTemplatePath } from "../../constants.mjs";

/**
 * A custom combat tracker that adds support for adding "player" type combatants.
 */
export class AHCombatTracker extends foundry.applications.sidebar.tabs.CombatTracker {

  /** @override */
  static PARTS = {
    header: {
      template: "templates/sidebar/tabs/combat/header.hbs",
    },
    tracker: {
      template: systemTemplatePath("apps/combat-tracker"),
      scrollable: [""],
    },
    footer: {
      template: "templates/sidebar/tabs/combat/footer.hbs",
    },
  };

  /** @inheritdoc */
  _getCombatContextOptions() {
    const options = super._getCombatContextOptions();
    options.unshift({
      name: "AH.Combat.AddPlayer",
      icon: "<i class=\"fa-solid fa-user\"></i>",
      condition: () => game.user.isGM,
      callback: () => this.viewed.addPlayer(),
    });
    return options;
  }

  /**
   * Prepare render context for a single entry in the combat tracker.
   * @param {Combat} combat        The active combat.
   * @param {AHCombatant} combatant  The Combatant whose turn is being prepared.
   * @param {number} index         The index of this entry in the turn order.
   * @returns {Promise<object>}
   * @protected
   */
  async _prepareTurnContext(combat, combatant, index) {
    const turn = await super._prepareTurnContext(combat, combatant, index);
    turn.faction = combatant.faction;
    if (combatant.hostile) {
      turn.intent = combatant.intent;
    }
    if (combatant.actor && (combatant.actor.type === "adversary")) {
      /** @type AdversaryProfileDataModel **/
      const profile = combatant.actor.system.profile;
      if (profile) {
        turn.profile = profile;
      }
    }
    return turn;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onCombatCreate(event, target) {
    if (foundry.documents.Combat.TYPES.length > 1) {
      const combat = await getDocumentClass("Combat").createDialog();
      if (combat) combat.activate({ render: false });
    }
    else super._onCombatCreate(event, target);
  }
}
