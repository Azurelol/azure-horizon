import AH from "../config.mjs";

/**
 * An intent is an action planned out by an adversary against a specific target.
 * @typedef IntentAction
 * @property {AH_Intent} type
 * @property {String} icon
 * @property {String[]} targets The ids of the targets of the action.
 * @property {String} item The id of the ability or attack to be used (an Item)
 */

/**
 * @param {AdversaryDataModel} system
 * @param {AHCombatant[]} combatants
 * @return {IntentAction[]}
 */
function generateIntents(system, combatants) {

  // TODO: Depending on the adversary role and what abilities/attacks they have, their intents
  // should be decided.
  if (system.profile.rank === "champion") {

  }
}

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
    const intents = generateIntents(system, combatants);
    ui.notifications.info(`Assigning intents for ${system.profile.rank} rank ${actor.name}`);
    if (system.profile.rank === "champion") {

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
