import AH from "../config.mjs";
import { MathUtils, ObjectUtils } from "../utils/_module.mjs";

/**
 * An intent is an action planned out by an adversary against a specific target.
 * @typedef IntentAction
 * @property {AH_Intent} type
 * @property {String} icon The intent icon. Assigned later.
 * @property {DocumentReference} item The id of the ability or attack to be used (an Item)
 */

/**
 * An intent is an action planned out by an adversary against a specific target.
 * @typedef IntentData
 * @property {IntentAction} primary
 * @property {IntentAction} secondary
 * @property {DocumentReference} target The ids of the targets of the action.
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

  // TODO: Update so that intent choices can be used [single/array]
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
        ["prepare", "burst"],
      ],
    },
    champion: {
      default: [
        ["attack", "damage", "empower", "damage"],
        ["empower", "damage", "prepare", "burst"],
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

  // Focuses on heavy damage at range
  artillery: {
    standard: {
      default: [
        ["attack"],
        ["prepare"],
        ["burst"],
      ],
    },
    elite: {
      default: [
        ["attack", "damage"],
        ["prepare", "burst"],
      ],
    },
    champion: {
      default: [
        ["attack", "damage", "prepare", "burst"],
        ["attack", "empower", "prepare", "burst"],
      ],
    },
  },

  // Lowers enemy effectiveness
  saboteur: {
    standard: {
      default: [
        ["attack"],
        ["weaken"],
        ["status"],
      ],
    },
    elite: {
      default: [
        ["attack", "weaken", "status"],
        ["damage", "prepare", "control"],
      ],
    },
    champion: {
      default: [
        ["attack", "damage", "prepare", "status"],
        ["attack", "empower", "prepare", "damage"],
      ],
    },
  },

  // Changes the battlefield
  controller: {
    standard: {
      default: [
        ["attack"],
        ["control"],
      ],
    },
    elite: {
      default: [
        ["attack", "control", "status"],
        ["attack", "prepare", "control"],
      ],
    },
    champion: {
      default: [
        ["attack", "damage", "prepare", "control"],
        ["damage", "prepare", "control", "damage"],
      ],
    },
  },

  // Enhances allies
  supporter: {
    standard: {
      default: [
        ["attack"],
        ["empower"],
      ],
    },
    elite: {
      default: [
        ["attack", "empower", "damage"],
        ["empower", "fortify", "damage"],
      ],
    },
    champion: {
      default: [
        ["attack", "fortify", "damage", "empower"],
        ["empower", "prepare", "damage", "empower"],
      ],
    },
  },

  // Commands allies
  leader: {
    standard: {
      default: [
        ["attack"],
      ],
    },
    elite: {
      default: [
        ["attack", "summon", "damage"],
        ["empower", "fortify", "damage"],
      ],
    },
    champion: {
      default: [
        ["attack", "fortify", "damage", "empower"],
        ["empower", "prepare", "damage", "empower"],
      ],
    },
  },

});

/**
 * @param {AH_Intent | AH_Intent[]} value
 * @returns {AH_Intent}
 */
function chooseIntent(value) {
  return Array.isArray(value)
    ? value[Math.floor(Math.random() * value.length)]
    : value;
}

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

  /** @type {AH_Intent[][]} The intents by round, looping around. **/
  let intents;

  /** @type {RoleRoutine} **/
  const routine = map[system.profile.rank];
  if (routine) {
    const variant = "default";
    intents = ObjectUtils.duplicate(routine[variant]);
  }
  else {
    intents = [];
  }

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

//TODO: FIx selection; change history to actor/combatant uuid, save on combat document

/**
 * Picks the hero to target.
 * @param {Map<HeroDataModel, Number>} history
 * @returns {DocumentReference}
 */
function selectTarget(history) {
  const heroes = history.keys().toArray();
  if (heroes.length === 0) {
    return [];
  }

  // The more times a target is picked, teh less likely it will be next time
  /** @type Number[] **/
  const weights = Array.from(history.values()).map(w => 1 / w);
  const index = MathUtils.weightedRandomIndex(weights);
  const target = heroes[index].parent;

  // Update the history
  history[heroes[index]]++;

  return {
    name: target.name,
    img: target.img,
    uuid: target.uuid,
  };
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
 * @return {IntentData[]}
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
  /** @type {Map<HeroDataModel,Number>} **/
  let targetHistory = new Map(heroes.map(key => [key, 1]));
  /** @type IntentData[] **/
  let actions = [];
  for (let t = 0; t < combatants.length; t++) {
    /** @type AH_Intent **/
    const intent = chooseIntent(cycle[t]);
    /** @type IntentData **/
    let action = {
      primary: {
        type: intent,
      },
    };
    /** @type {AttackDataModel|AbilityDataModel} **/
    let primaryItem;
    let targeted = false;
    let alsoAttack = false;

    switch (intent) {
      case "unknown":
        break;
      case "attack":
        primaryItem = selectAbility(attackItems);
        targeted = true;
        break;
      case "damage":
      case "weaken":
      case "empower":
      case "control":
      case "breach":
      case "status":
        primaryItem = selectAbility(abilityMap[action.primary.type]);
        targeted = true;
        break;
      case "burst":
        primaryItem = selectAbility(abilityMap[action.primary.type]);
        targeted = false;
        break;
      case "fortify":
      case "block":
      case "recovery":
        primaryItem = selectAbility(abilityMap[action.primary.type]);
        break;
      case "cast":
      case "channel":
      case "prepare":
        primaryItem = selectAbility(abilityMap[action.primary.type]);
        targeted = true;
        break;
      case "escape":
        primaryItem = selectAbility(abilityMap[action.primary.type]);
        break;
      case "summon":
        primaryItem = selectAbility(abilityMap[action.primary.type]);
        alsoAttack = true;
        break;
    }

    if (primaryItem) {
      action.primary.item = {
        img: primaryItem.parent.img,
        name: primaryItem.parent.name,
        uuid: primaryItem.parent.uuid,
      };
    }

    if (alsoAttack) {
      const secondaryItem = selectAbility(attackItems);
      action.secondary = {
        type: "attack",
        item: {
          img: secondaryItem.parent.img,
          name: secondaryItem.parent.name,
          uuid: secondaryItem.parent.uuid,
        },
      };
      targeted = true;
    }

    if (targeted) {
      action.target = selectTarget(targetHistory);
    }
    else {
      action.target = null;
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
function onCombatStart(combat, updateData, updateOptions) {
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

/**
 * Initialize the intent system.
 */
function initialize() {
  Hooks.on(AH.hooks.foundry.combat.combatStart, onCombatStart);
  Hooks.on(AH.hooks.foundry.combat.combatRound, onRoundChange);
  Hooks.on(AH.hooks.foundry.combat.combatTurn, onTurnChange);

}

const Intent = Object.freeze({
  initialize,
  resolveIntents,
});

export default Intent;
