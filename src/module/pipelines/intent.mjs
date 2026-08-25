import AH from "../config.mjs";
import { CheckPrompt } from "../helpers/check-prompt.mjs";
import { MathUtils } from "../utils/_module.mjs";

/**
 * An intent is an action planned out by an adversary against a specific target.
 * @typedef IntentAction
 * @property {AH_Intent} type
 * @property {String} icon The intent icon. Assigned later.
 * @property {DocumentReference[]} targets The ids of the targets of the action.
 * @property {DocumentReference} item The id of the ability or attack to be used (an Item)
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
 * Picks the hero to target.
 * @param {AbilityDataModel|AttackDataModel} item
 * @param {HeroDataModel[]} heroes
 * @returns {DocumentReference[]}
 */
function selectTargets(item, heroes) {
  if (heroes.length === 0) {
    return [];
  }
  let targets = Array.from(heroes);
  for (let i = targets.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [targets[i], targets[j]] = [targets[j], targets[i]];
  }
  // TODO: If there's more space in the tracker..
  return targets.slice(0, 1).map(t => {
    return {
      name: t.name,
      img: t.img,
      uuid: t.uuid,
    };
  });
}

/**
 * @param {AttackDataModel[]|AbilityDataModel[]} abilities
 * @return {AttackDataModel|AbilityDataModel}
 */
function selectAbility(abilities) {
  if ((abilities === undefined) || (abilities.length === 0)) {
    return undefined;
  }
  const weights = abilities.map(a => 1);
  const index = MathUtils.weightedRandomIndex(weights);
  return abilities[index];
}

/**
 * @param {AdversaryDataModel} adversary
 * @param {AHCombatant[]} combatants
 * @param {HeroDataModel[]} heroes
 * @return {IntentAction[]}
 */
function generateIntents(adversary, combatants, heroes) {

  const profile = adversary.profile;
  const assembly = profile.prepareAssemblyData();
  const abilityItems = assembly.abilities.entries;
  /** @type {Record<AH_Intent, AbilityDataModel[]>} **/
  const abilityMap = abilityItems.reduce((map, item) => {
    const intent = item.system.intent;
    (map[intent] ??= []).push(item.system);
    return map;
  }, {});
  /** @type AttackDataModel[] **/
  const attackItems = assembly.attacks.entries.map(item => item.system);

  const tactics = getRoutine(profile.role);
  /** @type RoleRoutine **/
  const routine = tactics[profile.rank];

  // The cycle for the current turn
  const cycle = routine.cycle[0];
  /** @type IntentAction[] **/
  let intents = [];
  for (let t = 0; t < combatants.length; t++) {
    /** @type IntentAction **/
    let action = {
      type: cycle[t],

    };
    /** @type {AttackDataModel|AbilityDataModel} **/
    let item;
    /** @type DocumentReference[] **/
    let targets;

    switch (action.type) {
      case "unknown":
        break;
      case "attack":{
        item = selectAbility(attackItems);
        targets = selectTargets(item, heroes);
      }
        break;
      case "damage":
        item = selectAbility(abilityMap.damage);
        targets = selectTargets(item, heroes);
        break;
      case "control":
        break;
      case "heal":
        item = selectAbility(abilityMap.heal);
        break;
      case "block":
        item = selectAbility(abilityMap.block);
        break;
      case "prepare":
        break;
      case "status":
        break;
    }

    if (item) {
      action.item = {
        img: item.img,
        name: item.name,
        uuid: item.uuid,
      };
      action.targets = targets;
    }

    intents.push(action);
  }

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
