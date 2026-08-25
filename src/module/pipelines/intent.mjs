import AH from "../config.mjs";
import { CheckPrompt } from "../helpers/check-prompt.mjs";

/**
 * An intent is an action planned out by an adversary against a specific target.
 * @typedef IntentAction
 * @property {AH_Intent} type
 * @property {IntentTarget[]} targets The ids of the targets of the action.
 * @property {String} item The id of the ability or attack to be used (an Item)
 * @property {String} icon Assigned later.
 */

/**
 * @typedef IntentTarget
 * @property {String} name
 * @property {String} uuid
 * @property {String} img
 */

/**
 * @typedef RoleRoutine
 * The actions to take during that turn.
 * @property {AH_Intent[][]} cycle The default  cycle of intents for the adversary.
 * @property {AH_Intent[][]} crisis A different cycle to execute once in crisis.
 */

/**
 * @typedef RoleTurn
 * @property
 */

/**
 * @typedef RoleTactics
 * @property {AH_Intent[][]} cycle
 * @property {RoleRoutine} standard
 * @property {RoleRoutine} elite
 * @property {RoleRoutine} champion
 */

/**
 * Routines for the different adversary roles.
 * @type {Record<AH_RoleType, RoleTactics>}
 */
const ROLE_ROUTINES = Object.freeze({

  default: {
    standard: {
      cycle: [
        ["attack"],
      ],
    },
    elite: {
      cycle: [
        ["attack"],
      ],
    },
    champion: {
      cycle: [
        ["attack"],
      ],
    },
  },

  // Hardy, high damage and can shift enemies.
  brute: {
    standard: {
      cycle: [
        ["attack"],
        ["damage"],
      ],
    },
    elite: {
      cycle: [
        ["attack", "damage"],
        ["empower", "damage"],
      ],
    },
    champion: {
      cycle: [
        ["attack", "damage"],
        ["empower", "damage"],
      ],
    },
  },

  // Mobile, focuses on weaker targets, slips by enemies.
  harrier: {
    standard: {
      cycle: [
        ["attack"],
        ["damage"],
      ],
    },
    elite: {
      cycle: [
        ["attack", "damage"],
        ["empower", "damage"],
      ],
    },
    champion: {
      cycle: [
        ["attack", "damage"],
        ["empower", "damage"],
      ],
    },
  },

});

/**
 * @typedef IntentAbilityTable
 * @property {AHItem[]} damage
 * @property {AHItem[]} empower
 * @property {AHItem[]} weaken
 * @property {AHItem[]} fortify
 * @property {AHItem[]} breach
 * @property {AHItem[]} status
 * @property {AHItem[]} control
 * @property {AHItem[]} prepare
 */

/** @type {AH_Intent[]} **/
const UNTARGETABLE_INTENTS = ["block", "heal", "prepare", "empower", "fortify"];

/**
 * @param {AH_RoleType} role
 * @return {RoleTactics}
 */
function getRoutine(role) {
  let routine = ROLE_ROUTINES[role];
  if (!routine) {
    routine = ROLE_ROUTINES.default;
  }
  return routine;
}

/**
 * @param {AdversaryDataModel} adversary
 * @param {AHCombatant[]} combatants
 * @param {HeroDataModel[]} heroes
 * @return {IntentAction[]}
 */
function generateIntents(adversary, combatants, heroes) {

  // TODO: Depending on the adversary role and what abilities/attacks they have, their intents
  // should be decided.

  const profile = adversary.profile;
  const assembly = profile.prepareAssemblyData();
  const attackItems = assembly.attacks.entries;
  const abilityItems = assembly.abilities.entries;

  // For every turn the adversary has, pick a target
  const targets = [];

  // TODO: Pick a target for the action
  const routine = getRoutine(profile.role);

  /** @type IntentAction[] **/
  let intents = [];

  switch (adversary.profile.rank) {
    // They don't really get actions
    case "minion":
      break;
    case "standard":
      break;
    case "elite":
      break;
    case "champion":
      break;
  }

  return intents;
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
  const heroes = combat.getHeroes();
  for (const [actor, combatants] of adversaries) {
    /** @type AdversaryDataModel **/
    const system = actor.system;
    const intents = generateIntents(system, combatants, heroes);
    // Assign the intents in order
    for (let c = 0; c < combatants.length; c++) {
      const intent = intents[c];
      const combatant = combatants[c];
      combatant.setIntent(intent);
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
  getRoutine,
});

export default Intent;
