import AH from "../config.mjs";

/**
 * Assign intents to all adversaries.
 * @param combat
 */
function process(combat) {
  const combatants = combat.getAdversaries();
  /** @type {Map<AHActor,AHCombatant[]>} **/
  const adversaries = new Map();

  for (const combatant of combatants) {
    const actor = combatant.actor;
    if (!actor) continue;

    if (!adversaries.has(actor)) {
      adversaries.set(actor, []);
    }
    adversaries.get(actor).push(combatant);
  }

  ui.notifications.info(`Assigning intent for adversaries (${adversaries.size})`);
  for (const [actor, combatants] of adversaries) {
    /** @type AdversaryDataModel **/
    const system = actor.system;
    if (system.profile.rank === "champion") {
      ui.notifications.info(`Assigning turn for champion ${actor.name}`);
    }
  }
}

/**
 * @param {AHCombat} combat
 * @param {CombatUpdateData} updateData
 */
function onCombatChange(combat, updateData, updateOptions) {
  if (updateData.round === 1) {
    process(combat);
  }
}

/**
 * @param {AHCombat} combat
 * @param {CombatUpdateData} updateData
 * @param updateOptions
 */
function onRoundChange(combat, updateData, updateOptions) {
  if (updateData.round !== 1) {
    process(combat);
  }
}

/**
 * @param {AHCombat} combat
 * @param {CombatUpdateData} updateData
 * @param updateOptions
 */
function onTurnChange(combat, updateData, updateOptions) {
  const turn = updateData.turn;
  const current = combat.turns[turn];
  if (current.hostile) {
  }
}

function initialize() {

  Hooks.on(AH.hooks.foundry.combat.combatStart, onCombatChange);
  Hooks.on(AH.hooks.foundry.combat.combatRound, onRoundChange);
  Hooks.on(AH.hooks.foundry.combat.combatTurn, onTurnChange);

}

const Intent = Object.freeze({
  initialize,
});

export default Intent;
