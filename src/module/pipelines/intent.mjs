import AH from "../config.mjs";
import { MathUtils, ObjectUtils } from "../utils/_module.mjs";

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
 * @property {AH_Intent[][]} default The default  cycle of intents for the adversary.
 * @property {AH_Intent[][]} crisis A different cycle to execute once in crisis.
 */

/**
 * @typedef RoleRoutineMap
 * @property {RoleRoutine} standard
 * @property {RoleRoutine} elite
 * @property {RoleRoutine} champion
 */

/**
 * Routines for the different adversary roles.
 * @type {Record<AH_RoleType, RoleRoutineMap>}
 */
const ROLE_ROUTINES = Object.freeze({

  default: {
    standard: {
      default: [
        ["unknown"],
      ],
    },
    elite: {
      default: [
        ["unknown", "unknown"],
      ],
    },
    champion: {
      default: [
        ["unknown", "unknown", "unknown", "unknown"],
      ],
    },
  },

  // Hardy, high damage and can shift enemies.
  brute: {
    standard: {
      default: [
        ["attack"],
        ["damage"],
      ],
    },
    elite: {
      default: [
        ["attack", "damage"],
        ["empower", "damage"],
      ],
    },
    champion: {
      default: [
        ["attack", "damage"],
        ["empower", "damage"],
      ],
    },
  },

  // Mobile, focuses on weaker targets, slips by enemies.
  harrier: {
    standard: {
      default: [
        ["attack"],
        ["damage"],
      ],
    },
    elite: {
      default: [
        ["attack", "damage"],
        ["empower", "damage"],
      ],
    },
    champion: {
      default: [
        ["attack", "damage"],
        ["empower", "damage"],
      ],
    },
  },

  // Defender, protects allies
  defender: {
    standard: {
      default: [
        ["attack"],
        ["block"],
      ],
    },
    elite: {
      default: [
        ["block", "attack"],
        ["fortify", "attack"],
      ],
    },
    champion: {
      default: [
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

/**
 * @param {AdversaryDataModel} system
 * @return {AH_Intent[][]}
 */
function resolveIntents(system) {
  /** @type RoleRoutineMap **/
  let map = ROLE_ROUTINES[system.profile.role];
  if (!map) {
    map = ROLE_ROUTINES.default;
  }

  /** @type {RoleRoutine} **/
  const routine = map[system.profile.rank];

  // TODO: Pick variant based on status
  const variant = "default";

  /** @type {AH_Intent[][]} The intents by round, looping around. **/
  let intents = ObjectUtils.duplicate(routine[variant]);
  const turns = system.profile.turns;
  for (let round of intents) {
    if (round.length < turns) {
      for (let i = 0; i <= (turns - round.length); i++) {
        round.push("unknown");
      }
    }
  }
  return intents;
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
  let targets = Array.from(heroes.map(h => h.parent));
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
 * @param {CombatRoundHistory} history
 * @return {IntentAction[]}
 */
function generateIntents(adversary, combatants, heroes, history) {

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

  const intents = resolveIntents(adversary);

  // The cycle for the current turn.
  let cycleIndex;
  if (history !== undefined) {
    cycleIndex = history.round % intents.length;
    const adversaryActorUuid = adversary.parent.uuid;
    const actorHistory = history.actors.find((uuid) => uuid === adversaryActorUuid);
    if (actorHistory) {
      // TODO: Pull additional data?
    }
  }
  else {
    cycleIndex = 0;
  }

  /** @type AH_Intent[] **/
  const cycle = intents[Math.min(intents.length - 1, cycleIndex)];

  /** @type IntentAction[] **/
  let actions = [];
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
        img: item.parent.img,
        name: item.parent.name,
        uuid: item.parent.uuid,
      };
      action.targets = targets;
    }

    actions.push(action);
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

  return actions;
}

/**
 * Assign intents to all adversaries.
 * @param {AHCombat} combat
 * @param {Number} round
 */
function process(combat, round) {
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

  const heroes = combat.getHeroes().map(h => h.actor.system);

  let history;
  if (round !== 1) {
    history = combat.system.rounds[round - 2]; // Because we are using 0-indexing AND round is the number of the UPCOMING round.
  }

  let newRoundHistory = {
    round: round,
    actors: [],
  };

  for (const [actor, combatants] of adversaries) {
    /** @type AdversaryDataModel **/
    const system = actor.system;
    const actions = generateIntents(system, combatants, heroes, history);
    // Assign the intents in order
    for (let c = 0; c < combatants.length; c++) {
      const intent = actions[c];
      const combatant = combatants[c];
      combatant.setIntent(intent);
      newRoundHistory.actors.push({
        actor: actor.uuid,
        actions: actions,
      });
    }
  }

  combat.system.addRoundHistory(newRoundHistory);
}

/**
 * @param {AHCombat} combat
 * @param {CombatUpdateData} updateData
 */
function onCombatChange(combat, updateData, updateOptions) {
  if (updateData.round === 1) {
    process(combat, updateData.round);
  }
}

/**
 * @param {AHCombat} combat
 * @param {CombatUpdateData} updateData
 * @param updateOptions
 */
function onRoundChange(combat, updateData, updateOptions) {
  if (updateData.round !== 1) {
    process(combat, updateData.round);
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
  resolveIntents,
});

export default Intent;
