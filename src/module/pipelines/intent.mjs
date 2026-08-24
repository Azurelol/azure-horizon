import AH from "../config.mjs";

/**
 * Assign intents to all adversaries.
 * @param combat
 */
function process(combat) {
  const adversaries = combat.getAdversaries();
  ui.notifications.info(`Assigning intent for ${adversaries.length} adversaries`);
  for (const adversary of adversaries) {

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
