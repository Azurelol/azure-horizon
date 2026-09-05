// NOTE: This file should have no other dependencies
import { getSystemSetting, systemAssetPath, systemID, systemNS } from "./constants.mjs";
import StringUtils from "./utils/string-utils.mjs";

const AH = {};

/** @import { SettingConfig } from "@client/_types.mjs" */

const fields = foundry.data.fields;

/**
 * @typedef DocumentReference
 * @property {String} name
 * @property {String} uuid
 * @property {String} img
 */

/**
 * @typedef AH_Constant
 * @property {String|undefined} label
 * @property {String|undefined} long
 * @property {String|undefined} short
 * @property {String} tooltip
 * @property {String} icon
 */

/**
 * @param {Object} value
 * @param {AH_LocalizationFormat} format
 * @returns {*}
 */
function resolveConfigRecordLabel(value, format) {
  if (format) {
    if (value[format]) {
      return value[format];
    }
    if (value.label) {
      return value.label;
    }
  }
  return value;
}

/**
 * @param {Record<String, String|AH_Constant>} record   *
 * @param {AH_LocalizationFormat} format
 * @returns {FormSelectOption[]}
 * @remarks To be used with specific records.
 */
export function getFormSelectOptions(record, format = "long") {
  return Object.entries(record).map(([key, value]) => ({
    label: StringUtils.localize(resolveConfigRecordLabel(value, format)),
    value: key,
  }));
}

/**
 * @typedef {String} AH_Slug
 * An identifier for items in the system's compendium.
 */

/**
 * Default system values for various important properties.
 * @type {Record<string, *>}
 */
AH.defaults = {
  attribute: {
    min: 4,
    max: 20,
  },
  action: {
    attack: { cost: 2 },
  },
  grade: "B",
  damage: {
    bonus: 5,
  },
  analysis: {
    max: 3,
  },
  check: {
    type: "attribute",
    criticalThreshold: 8,
  },
  potential: {
    min: 0,
    max: 5,
  },
};

/**
 * @typedef {'status'|'skill'|'equipment'|'situation'} AH_Modifier
 */

AH.modifiers = Object.freeze({
  status: { label: "AH.STATUS.MODIFIER.Status" },
  skill: { label: "AH.STATUS.MODIFIER.Skill" },
  equipment: { label: "AH.STATUS.MODIFIER.Equipment" },
  situation: { label: "AH.STATUS.MODIFIER.Situation" },
});

/**
 * @typedef {'crisis'} AH_StatusEffect
 * System-specific status effects.
 */

AH.statusEffects = Object.freeze({
  crisis: "AH.STATUS.Crisis",
});

AH.difficulties = Object.freeze({
  classic: "AH.DIFFICULTY.Classic",
  horizon: "AH.DIFFICULTY.Horizon",
});

/**
 * @typedef {'E'|'D'|'C'|'B'|'A'|'S'} AH_Grade A letter grade to represent an attack's scaling with the character's attributes.
 */

AH.grades = Object.freeze({
  E: { label: "E", scale: 0.5, base: 3 },
  D: { label: "D", scale: 0.75, base: 5 },
  C: { label: "C", scale: 1, base: 8 }, // Baseline
  B: { label: "B", scale: 1.25, base: 10 },
  A: { label: "A", scale: 1.5, base: 12 },
  S: { label: "S", scale: 2, base: 15 },
});

/** @typedef {'easy'|'normal'|'hard'|'impossible'} AH_DifficultyLevel **/

AH.difficultyLevel = Object.freeze({
  easy: { label: "AH.DIFFICULTY.Easy", value: 7 },
  normal: { label: "AH.DIFFICULTY.Normal", value: 10 },
  hard: { label: "AH.DIFFICULTY.Hard", value: 13 },
  impossible: { label: "AH.DIFFICULTY.Impossible", value: 16 },
});

/**
 * @typedef {'low'|'moderate'|'high'|'severe'|'extreme'} AH_Power A multiplier used for additional damage scaling.
 */

AH.power = Object.freeze({
  low: { label: "AH.ACTION.POWER.Low", multiplicative: 1.2 },
  moderate: { label: "AH.ACTION.POWER.Moderate", multiplicative: 1.4 },
  high: { label: "AH.ACTION.POWER.High", multiplicative: 1.6, difficulty: 13 },
  severe: { label: "AH.ACTION.POWER.Severe", multiplicative: 1.8 },
  extreme: { label: "AH.ACTION.POWER.Extreme", multiplicative: 2 },
});

/**
 * @typedef {'minor'|'medium'|'major'|'utmost'} AH_Potency
 */

AH.potency = Object.freeze({
  minor: { label: "AH.ACTION.POTENCY.Minor", difficulty: AH.difficultyLevel.easy.value, cost: 20, selected: true },
  medium: { label: "AH.ACTION.POTENCY.Medium", difficulty: AH.difficultyLevel.normal.value, cost: 30 },
  major: { label: "AH.ACTION.POTENCY.Major", difficulty: AH.difficultyLevel.hard.value, cost: 40 },
  utmost: { label: "AH.ACTION.POTENCY.Utmost", difficulty: AH.difficultyLevel.impossible.value, cost: 50 },
});

//TODO: Rename?
/**
 * @typedef {'reduced'|'standard'|'powerful'} AH_ActionPotency
 */

AH.potencies = Object.freeze({
  reduced: { label: "AH.ACTION.POTENCY.Reduced", icon: "ah-icon-potency-reduced" },
  standard: { label: "AH.ACTION.POTENCY.Standard", icon: "ah-icon-potency-standard" },
  powerful: { label: "AH.ACTION.POTENCY.Powerful", icon: "ah-icon-potency-powerful" },
});

/**
 * @typedef {'entity'|'small'|'large'|'huge'} AH_Area
 */

AH.area = {
  entity: { label: "AH.ACTION.AREA.Individual", multiplier: 1, selected: true },
  small: { label: "AH.ACTION.AREA.Small", multiplier: 2 },
  large: { label: "AH.ACTION.AREA.Large", multiplier: 3 },
  huge: { label: "AH.ACTION.AREA.Huge", multiplier: 4 },
};

/**
 * @typedef {'common'|'rare'|'epic'} AH_Rarity
 */

AH.rarity = Object.freeze({
  common: { label: "AH.EQUIPMENT.RARITY.Common" },
  rare: { label: "AH.EQUIPMENT.RARITY.Rare" },
});

/**
 * @typedef {'partial'|'success'|'critical'} AH_Outcome
 */

AH.outcome = Object.freeze({
  critical: { label: "AH.ACTION.OUTCOME.Critical" },
  success: { label: "AH.ACTION.OUTCOME.Success" },
  partial: { label: "AH.ACTION.OUTCOME.Partial" },
  fumble: { label: "AH.ACTION.OUTCOME.Fumble" },
});

/**
 * System themes.
 * @type {Record<String, {label, path}>}
 */
AH.themes = {
  horizon: {
    label: "AH.THEMES.Horizon",
    path: systemAssetPath("themes/horizon.json"),
  },
  crimsonSky: {
    label: "AH.THEMES.CrimsonSky",
    path: systemAssetPath("themes/crimson-sky.json"),
  },
};

/**
 * Character progression constants.
 */
AH.progression = Object.freeze({
  level: {
    minimum: 10,
    maximum: 99,
  },
});

/**
 * The set of ability scores used for characters in the system.
 * @typedef {"dex", "str", "res", "per"} AH_Attribute
 */

/**
 * @type {Object<AH_Attribute, AH_Constant>}
 */
AH.attributes = {
  mig: { long: "AH.CHARACTER.Might.long", short: "AH.CHARACTER.Might.short" },
  dex: { long: "AH.CHARACTER.Dexterity.long", short: "AH.CHARACTER.Dexterity.short" },
  ins: { long: "AH.CHARACTER.Insight.long", short: "AH.CHARACTER.Insight.short" },
  wlp: { long: "AH.CHARACTER.Willpower.long", short: "AH.CHARACTER.Willpower.short" },
};

AH.attributeDice = {
  4: "AH.DICE.D4",
  6: "AH.DICE.D6",
  8: "AH.DICE.D8",
  10: "AH.DICE.D10",
  12: "AH.DICE.D12",
};

/**
 * @typedef AH_ActionCheck
 * @property {String} difficulty
 * @property {Number} threshold
 */

/**
 * @typedef {"attribute"|"open"|'action'|'defense'|'ritual'} CheckType
 */

/**
 * @type {Object<CheckType, string>}
 */
AH.checkTypes = {
  attribute: "AH.CHECK.Attribute",
  open: "AH.CHECK.Open",
  action: "AH.CHECK.Action",
  defense: "AH.CHECK.Defense",
  ritual: "AH.CHECK.Ritual",
};

/**
 * @desc The set of ability scores used for characters in the system.
 * @typedef {"hp"|"mp"|"tp"|"ip"|"thp"} AH_Resource
 */

/**
 * @type {Record<string, AH_Constant>}}
 */
AH.resourceTypes = {
  hp: { label: "AH.CHARACTER.HitPoint.short", temporary: "AH.CHARACTER.TemporaryHitPoint.short", icon: "ah-icon-hp" },
  mp: { label: "AH.CHARACTER.MindPoint.short", icon: "ah-icon-mp" },
  ip: { label: "AH.CHARACTER.InventoryPoint.short", icon: "ah-icon-ip" },
  tp: { label: "AH.CHARACTER.TensionPoint.short", icon: "ah-icon-tp" },
  thp: { label: "AH.CHARACTER.TemporaryHitPoint.short", icon: "ah-icon-thp" },
};

/**
 * @typedef {'attack'|'defend'|'skill'|'spell'|'inventory'|'equipment'|'objective'} AH_Action
 */

AH.actions = Object.freeze({
  attack: { label: "AH.ACTION.Attack" },
  defend: { label: "AH.ACTION.Defend" },
  skill: { label: "AH.ACTION.Skill" },
  spell: { label: "AH.ACTION.Spell" },
  inventory: { label: "AH.ACTION.Inventory" },
  equipment: { label: "AH.ACTION.Equipment" },
  objective: { label: "AH.ACTION.Objective" },
});

/**
 * @typedef {'instant'|'fast'|'slow'} AH_Speed
 */

AH.speed = Object.freeze({
  instant: { label: "AH.ACTION.SPEED.Instant" }, // Immediate
  fast: { label: "AH.ACTION.SPEED.Fast" }, // Finishes at next SOT
  slow: { label: "AH.ACTION.SPEED.Slow" }, // Finishes at next EOT
});

/**
 * Provided defaults for the party codex.
 * @type {{tags: {character: string, location: string, event: string}}}
 */
AH.codex = {
  tags: {
    character: "AH.CODEX.Tags.Character",
    location: "AH.CODEX.Tags.Location",
    event: "AH.CODEX.Tags.Event",
  },
};

/**
 * @typedef {'additive'|'multiplicative'} AH_ModifierType
 */

/**
 * @typedef {'incoming'|'outgoing'} AH_ModifierDirection
 */

AH.modifier = Object.freeze({
  type: {
    additive: {
      long: "AH.STATUS.MODIFIER.Additive",
      short: "+",
    },
    multiplicative: {
      long: "AH.STATUS.MODIFIER.Multiplicative",
      short: "*",
    },
  },
  direction: {
    incoming: "AH.STATUS.MODIFIER.Incoming",
    outgoing: "AH.STATUS.MODIFIER.Outgoing",
  },
});

/**
 * @typedef {'resistance'|'vulnerability'|'immunity'} AH_Affinity
 */

AH.affinities = Object.freeze({
  vulnerability: {
    long: "AH.DAMAGE.AFFINITY.Vulnerability.long",
    short: "AH.DAMAGE.AFFINITY.Vulnerability.short",
    modifier: "1.25",
  },
  resistance: {
    long: "AH.DAMAGE.AFFINITY.Resistance.long",
    short: "AH.DAMAGE.AFFINITY.Resistance.short",
    modifier: "0.75",
  },
  immunity: {
    long: "AH.DAMAGE.AFFINITY.Immunity.long",
    short: "AH.DAMAGE.AFFINITY.Immunity.short",
    modifier: "0",
  },
  // TODO: Implement as a flag/property??
  // absorption: {
  //   label: "AH.DAMAGE.AFFINITY.Absorption",
  //   modifier: "-1",
  // },
});

/**
 * @typedef {'universal'|'physical'|'elemental'|'spiritual'} AH_DamageGroup
 */

AH.damageGroups = Object.freeze({
  universal: "AH.DAMAGE.Universal",
  physical: "AH.DAMAGE.Physical",
  elemental: "AH.DAMAGE.Elemental",
  spiritual: "AH.DAMAGE.Spiritual",
});

/**
 * @typedef {'untyped'|'slashing'|'piercing'|'bludgeoning'|'fire'|'cold'|'electric'|'acid'|'light'|'dark'|'mental'|'poison'} AH_DamageType
 */

/**
 * @typedef {AH_Constant} AH_DamageTypeMetadata
 * @property {AH_DamageGroup} group
 */

/**
 * @type {Record<String, AH_DamageTypeMetadata>}
 */
AH.damageTypes = Object.freeze({
  untyped: { long: "AH.DAMAGE.Untyped.long", short: "AH.DAMAGE.Untyped.short", group: null },

  slashing: { long: "AH.DAMAGE.Slashing.long", short: "AH.DAMAGE.Slashing.short", group: "physical" },
  piercing: { long: "AH.DAMAGE.Piercing.long", short: "AH.DAMAGE.Piercing.short", group: "physical" },
  bludgeoning: { long: "AH.DAMAGE.Bludgeoning.long", short: "AH.DAMAGE.Bludgeoning.short", group: "physical" },

  fire: { long: "AH.DAMAGE.Fire.long", short: "AH.DAMAGE.Fire.short", group: "elemental" },
  cold: { long: "AH.DAMAGE.Cold.long", short: "AH.DAMAGE.Cold.short", group: "elemental" },
  electric: { long: "AH.DAMAGE.Electric.long", short: "AH.DAMAGE.Electric.short", group: "elemental" },
  acid: { long: "AH.DAMAGE.Acid.long", short: "AH.DAMAGE.Acid.short", group: "elemental" },

  light: { long: "AH.DAMAGE.Light.long", short: "AH.DAMAGE.Light.short", group: "spiritual" },
  dark: { long: "AH.DAMAGE.Dark.long", short: "AH.DAMAGE.Dark.short", group: "spiritual" },

  mental: { long: "AH.DAMAGE.Mental.long", short: "AH.DAMAGE.Mental.short", group: null },
  poison: { long: "AH.DAMAGE.Poison.long", short: "AH.DAMAGE.Poison.short", group: null },
});

/**
 * @typedef {"def"|"mdef"|"dex"|"ins"|"mig"|"wlp"} AH_Defense
 */

/**
 * @typedef {'deflection'|'avoidance'} AH_DefenseTrait
 */

AH.defenses = Object.freeze({
  def: { long: "AH.CHARACTER.Defense.long", short: "AH.CHARACTER.Defense.short" },
  mdef: { long: "AH.CHARACTER.MagicDefense.long", short: "AH.CHARACTER.MagicDefense.short" },
  dex: { long: "AH.CHARACTER.Dexterity.long", short: "AH.CHARACTER.Dexterity.short" },
  ins: { long: "AH.CHARACTER.Insight.long", short: "AH.CHARACTER.Insight.short" },
  wlp: { long: "AH.CHARACTER.Willpower.long", short: "AH.CHARACTER.Willpower.short" },
  mig: { long: "AH.CHARACTER.Might.long", short: "AH.CHARACTER.Might.short" },
});

/**
 * @typedef {'light'|'dark'} AH_Domain
 */

AH.domains = Object.freeze({
  light: { label: "AH.DOMAIN.Light" },
  dark: { label: "AH.DOMAIN.Dark" },
  nature: { label: "AH.DOMAIN.Nature" },
  elemental: { label: "AH.DOMAIN.Elemental" },
});

/**
 * @typedef {'none' | 'startOfTurn' | 'endOfTurn' | 'endOfRound' | 'endOfScene' | 'rest'} Interval
 */

/**
 * @typedef {'short'|'long'|'resupply'} AH_RestType
 */

/**
 * @description Scene intervals, used for things like skill activations, expiry of active effects
 */
AH.intervals = Object.freeze({
  none: "AH.COMMON.None",
  startOfTurn: "AH.INTERVAL.StartOfTurn",
  endOfTurn: "AH.INTERVAL.EndOfTurn",
  endOfRound: "AH.INTERVAL.EndOfRound",
  endOfScene: "AH.INTERVAL.EndOfScene",
  shortRest: "AH.INTERVAL.ShortRest",
  longRest: "AH.INTERVAL.LongRest",
});

/**
 * @typedef {"hero"|'follower'|"party"|"adversary"|"entity"|"unit"} AH_ActorType
 */

AH.actorTypes = Object.freeze({
  character: "TYPES.Actor.Character",
  adversary: "TYPES.Actor.Adversary",
  party: "TYPES.Actor.Party",
  follower: "TYPES.Actor.Follower",
});

/**
 * @typedef {"guest"|'companion'} AH_FollowerType
 */
AH.followerTypes = Object.freeze({
  guest: { label: "AH.FOLLOWER.Guest" },
  companion: { label: "AH.FOLLOWER.Companion" },
});

/**
 * @typedef {'command'|'reaction'|'initiative'} AH_TriggerType
 */

AH.triggers = Object.freeze({
  command: { label: "AH.FOLLOWER.MOVE.Command" },
  reaction: { label: "AH.FOLLOWER.MOVE.Reaction" },
  initiative: { label: "AH.FOLLOWER.MOVE.Initiative" },
  startOfRound: { label: "AH.FOLLOWER.MOVE.StartOfRound" },
  endOfRound: { label: "AH.FOLLOWER.MOVE.EndOfRound" },
});

/**
 * @typedef {'weapon'|'armor'|'accessory'|'skill'|'classFeature'|'spell'|'consumable'|'attack'|'ability'|'class'|'move'} AH_ItemType
 */

AH.itemTypes = {
  weapon: "AH.ITEM.Weapon",
  armor: "AH.ITEM.Armor",
  skill: "AH.ITEM.Skill",
};

/**
 * @typedef {"attack" | "skill" | "spell" | "item"} AH_ItemGroup
 */

AH.itemGroups = {
  attack: "AH.ITEM.Attack",
  skill: "AH.ITEM.Skill",
  spell: "AH.ITEM.Spell",
  item: "AH.ITEM.Item",
};

/**
 * @typedef {"one-handed", "two-handed"} AH_Handedness
 */

/**
 * @type {Record<AH_Handedness, string>}
 */
AH.handedness = {
  one: "AH.FIELD.OneHanded",
  two: "AH.FIELD.TwoHanded",
};

/**
 * @typedef {"melee", "ranged"} AH_ActionRange
 */

AH.attackTypes = Object.freeze({
  attack: "AH.ITEM.Attack",
  weapon: "AH.ITEM.Weapon",
});

/**
 * @typedef {'light'|'heavy'} AH_ArmorCategory
 */

/**
 * @type {Record<AH_Handedness, string>}
 */
AH.armorCategories = {
  light: "AH.FIELD.Light",
  heavy: "AH.FIELD.Heavy",
};

/**
 * @typedef {'deflection'} AH_ArmorDefense
 */

AH.armorDefense = Object.freeze({
  deflection: "AH.FIELD.Deflection",
});

/**
 * @typedef {'buff'|'debuff'} AH_EffectSelector
 */

AH.effectSelector = Object.freeze({
  buff: "AH.FIELD.Buff",
  deuff: "AH.FIELD.Debuff",
});

/**
 * @description How the active effect's duration is tracked
 * @type {{self: string, source: string}}
 */
AH.effectTracking = {
  self: "AH.COMMON.Self",
  source: "AH.COMMON.Source",
};

/**
 * @typedef {'bar'|'clock'} AH_TrackerStyle
 */

AH.trackerStyles = {
  clock: "AH.COMMON.Clock",
  bar: "AH.COMMON.Bar",
};

/**
 * @typedef {"custom", "harrier", "brute", "defender", "artillery", "saboteur", "controller", "supporter", "leader"} AH_RoleType
 */

/**
 * @type {Record<AH_RoleType, string>}
 */
AH.role = {
  custom: "AH.ADVERSARY.ROLE.Custom",
  harrier: "AH.ADVERSARY.ROLE.Harrier", // Mobile, focuses on weaker targets, slips by enemies.
  brute: "AH.ADVERSARY.ROLE.Brute", // Hardy, high damage and can shift enemies.
  defender: "AH.ADVERSARY.ROLE.Defender", // Protect allies, redirects attacks.
  artillery: "AH.ADVERSARY.ROLE.Artillery", // Unleash powerful attacks from the back row.
  saboteur: "AH.ADVERSARY.ROLE.Saboteur", // Lower enemy effectiveness.
  controller: "AH.ADVERSARY.ROLE.Controller", // Change the battlefield.
  supporter: "AH.ADVERSARY.ROLE.Supporter", // Supports allies.
  leader: "AH.ADVERSARY.ROLE.Leader", // Commands allies, affects action economy.
};

/**
 * @typedef {'low'|'normal'|'high'|'always'} AH_Weight
 */

AH.weights = Object.freeze({
  low: { value: 1, label: "Low", tooltip: "Below-average likelihood" },
  normal: { value: 2, label: "Normal", tooltip: "Baseline likelihood" },
  high: { value: 4, label: "High", tooltip: "Above-average likelihood" },
  always: { value: 99, label: "Always", tooltip: "Chosen whenever available, overriding other options" },
});

/**
 * @typedef {'unknown'|'attack'|'damage'|'control'|'heal'|'block'|'prepare'|'status'} AH_Intent
 */

AH.intents = Object.freeze({
  unknown: { label: "AH.ADVERSARY.INTENT.Unknown", icon: "ra ra-uncertainty", tooltip: "AH.ADVERSARY.INTENT.UnknownHint" },
  attack: { label: "AH.ADVERSARY.INTENT.Attack", icon: "ra ra-sword", tooltip: "AH.ADVERSARY.INTENT.AttackHint" },

  damage: { label: "AH.ADVERSARY.INTENT.Damage", icon: "ra ra-all-for-one", tooltip: "AH.ADVERSARY.INTENT.DamageHint" }, // Damaging ability
  empower: { label: "AH.ADVERSARY.INTENT.Empower", icon: "ra ra-fire-symbol", tooltip: "AH.ADVERSARY.INTENT.EmpowerHint" }, // Offensive buff
  weaken: { label: "AH.ADVERSARY.INTENT.Weaken", icon: "ra ra-cracked-shield", tooltip: "AH.ADVERSARY.INTENT.WeakenHint" }, // Offensive debuff
  fortify: { label: "AH.ADVERSARY.INTENT.Fortify", icon: "ra ra-bolt-shield", tooltip: "AH.ADVERSARY.INTENT.FortifyHint" }, // Defensive buff
  breach: { label: "AH.ADVERSARY.INTENT.Breach", icon: "ra ra-cracked-shield", tooltip: "AH.ADVERSARY.INTENT.BreachHint" }, // Defensive debuff
  status: { label: "AH.ADVERSARY.INTENT.Status", icon: "ra ra-poison-bottle", tooltip: "AH.ADVERSARY.INTENT.StatusHint" }, // Status effect
  control: { label: "AH.ADVERSARY.INTENT.Control", icon: "ra ra-hypnotized-eye", tooltip: "AH.ADVERSARY.INTENT.ControlHint" }, // Controlling ability

  prepare: { label: "AH.ADVERSARY.INTENT.Prepare", icon: "ra ra-hourglass", tooltip: "AH.ADVERSARY.INTENT.PrepareHint" }, // Prepare an action
  cast: { label: "AH.ADVERSARY.INTENT.Cast", icon: "ra ra-crystal-wand", tooltip: "AH.ADVERSARY.INTENT.CastHint" }, // Prepare an action
  channel: { label: "AH.ADVERSARY.INTENT.Channel", icon: "ra ra-sunbeams", tooltip: "AH.ADVERSARY.INTENT.Channel" }, // Prepare an action

  block: { label: "AH.ADVERSARY.INTENT.Block", icon: "ra ra-shield", tooltip: "AH.ADVERSARY.INTENT.BlockHint" }, // Heal self
  recovery: { label: "AH.ADVERSARY.INTENT.Recovery", icon: "ra ra-heart-plus", tooltip: "AH.ADVERSARY.INTENT.RecoveryHint" }, // Heal self
  escape: { label: "AH.ADVERSARY.INTENT.Escape", icon: "ra ra-run", tooltip: "AH.ADVERSARY.INTENT.EscapeHint" }, // Escape combat
  summon: { label: "AH.ADVERSARY.INTENT.Summon", icon: "ra ra-summon", tooltip: "AH.ADVERSARY.INTENT.SummonHint" }, // Summon minion
});

/**
 * @typedef {'minion'|'standard'|'elite'|'champion'} AH_Rank
 */

AH.rank = Object.freeze({
  minion: "AH.ADVERSARY.RANK.Minion",
  standard: "AH.ADVERSARY.RANK.Standard",
  elite: "AH.ADVERSARY.RANK.Elite",
  champion: "AH.ADVERSARY.RANK.Champion",
});

/**
 * @typedef {"odd" | "even"} AH_Parity
 */

/**
 * @description Property of an integer of whether it is even or odd.
 */
AH.parity = Object.freeze({
  even: "AH.COMMON.Even",
  odd: "AH.COMMON.Odd",
});

/**
 * @typedef {"source" | "initial" | "self" | "allies" | "enemies" | "scene" | "none"} AH_TargetSelector
 */

/**
 * @description Used to determine how to select the targets from a given event.
 */
AH.targetSelector = Object.freeze({
  source: "AH.FIELD.Source",
  initial: "AH.FIELD.Initial",
  self: "AH.FIELD.Self",
  allies: "AH.FIELD.Allies",
  enemies: "AH.FIELD.Enemies",
  scene: "AH.FIELD.Scene",
  none: "AH.FIELD.None",
});

/**
 * @typedef {"any" | "all" | "none"} AH_PredicateQuantifier
 */

AH.predicateQuantifier = {
  any: "AH.COMMON.Any",
  all: "AH.COMMON.All",
  none: "AH.COMMON.None",
};

/**
 * @typedef {"greaterThan" | "lessThan"} AH_ComparisonOperator
 */

/**
 * @typedef AH_Threshold
 * @property {AH_ComparisonOperator} operator
 * @property {Number} amount
 */

AH.comparisonOperator = {
  greaterThan: "AH.FIELD.GreaterThan",
  equals: "AH.FIELD.Equals",
  lessThan: "AH.FIELD.LessThan",
};

/**
 * @typedef {"self", "single", "multiple"} AH_TargetingRule
 */
AH.targetingRule = {
  self: "AH.TARGETING.RULE.Self",
  single: "AH.TARGETING.RULE.Single",
  multiple: "AH.TARGETING.RULE.Multiple",
};

/**
 * @typedef {"source" | "target"} AH_EventRelationKey
 */

/**
 * @description Used to determine the actor's relation to am event
 */
AH.eventRelation = Object.freeze({
  source: "AH.COMMON.Source",
  target: "AH.COMMON.Target",
});

/**
 * @typedef {'basic'|'detailed'|'complete'} AH_Analysis
 */

AH.analysis = Object.freeze({
  basic: "AH.ADVERSARY.ANALYSIS.Basic",
  detailed: "AH.ADVERSARY.ANALYSIS.Detailed",
  complete: "AH.ADVERSARY.ANALYSIS.Complete",
});

/**
 * @typedef {'startOfCombat' | 'startOfTurn' | 'endOfTurn' | 'startOfRound' | 'endOfRound' | 'endOfCombat'} AH_CombatEvent
 */

AH.combat = Object.freeze({
  /**
   * @desc Factions of the system.
   */
  factions: {
    heroes: {
      label: "AH.COMMON.Heroes",
    },
    adversaries: {
      label: "AH.COMMON.Adversaries",
    },
  },
  /**
   * @description Events dispatched during battle scenes.
   * @remarks Uses {@linkcode CombatEvent}
   */
  event: {
    startOfCombat: "AH.COMBAT.Start",
    startOfTurn: "AH.COMBAT.TurnStart",
    endOfTurn: "H.COMBAT.TurnEnd",
    startOfRound: "H.COMBAT.RoundStart",
    endOfRound: "AH.COMBAT.RoundEnd",
    endOfCombat: "H.COMBAT.End",
  },
});

/**
 * @typedef {'theme'|'activeParty'} AH_SystemSetting
 */

let _scale;

/**
 * Handles the scaling of any value according to the current difficulty
 * @param {Number|String} value
 */
export function scaleValue(value) {
  if (_scale === undefined) {
    _scale = getSystemSetting("scale", 1);
  }
  if (typeof value === "string") {
    const nValue = Number.parseInt(value);
    if (nValue) {
      return Math.round(nValue * _scale);
    }
    return value;
  }
  return Math.round(value * _scale);
}

/**
 * All settings associated with the system.
 * @type {Record<string, SettingConfig>}
 */
AH.settings = Object.freeze({
  migrationVersion: {
    name: "AH.Setting.MigrationVersion.Label",
    hint: "AH.Setting.MigrationVersion.Hint",
    type: new fields.StringField({ required: true }),
    default: "",
    scope: "world",
  },
  theme: {
    name: "AH.SETTING.Theme",
    hint: "AH.SETTING.ThemeHint",
    type: Object,
    requiresReload: false,
    default: null,
    scope: "world",
  },
  difficulty: {
    name: "AH.SETTING.Difficulty",
    hint: "AH.SETTING.DifficultyHint",
    type: String,
    config: true,
    default: "horizon",
    scope: "world",
    choices: () => AH.difficulties,
    requiresReload: true,
  },
  scale: {
    name: "AH.SETTING.Scale",
    hint: "AH.SETTING.ScaleHint",
    type: Number,
    config: true,
    default: 1,
    scope: "world",
    requiresReload: true,
  },
  codexUploadDirectory: {
    name: "AH.SETTING.UploadDirectory",
    hint: "AH.SETTING.UploadDirectoryHint",
    scope: "world",
    config: true,
    type: String,
    filePicker: "folder",
  },
  activeParty: {
    name: "AH.SETTING.ActiveParty",
    hint: "AH.SETTING.ActivePartyHint",
    icon: "fa-solid fa-users",
    config: true,
    scope: "world",
    // eslint-disable-next-line no-undef
    type: new fields.ForeignDocumentField(Actor, {
      nullable: true,
      blank: true,
      idOnly: true,
      choices: () => Object.fromEntries(game.actors.contents.filter((actor) => actor.type === "party").map((a) => [a.id, a.name])),
    }),
    restricted: true,
  },
});

/**
 * System-specific flags used.
 */
AH.flags = Object.freeze({
  // ActiveEffect
  ActiveEffect: Object.freeze({
    Source: "Source",
    Suppressed: "Suppressed",
    Temporary: "Temporary",
    Identifier: "Identifier",
  }),
  // Combat
  Combat: Object.freeze({
    FirstTurn: "First Turn",
    CurrentTurn: "Current Turn",
    TurnStarted: "TurnStarted",
    TurnTaken: "TurnTaken",
  }),
  // Combatant
  Combatant: Object.freeze({
    Intent: "Intent",
  }),
  // ChatMessage
  ChatMessage: Object.freeze({
    Check: "Check",
    DefenseCheck: "DefenseCheck",
    Source: "Source", /** @remarks Refers to {@linkcode SourceInfo} **/
    Item: "Item",
    Effect: "Effect",
    /** @remarks Refers to {@linkcode DamageData} **/
    Damage: "Damage",
    Resource: "Resource",
    RevertedAction: "RevertedAction",
    Targeting: "Targeting",
  }),
});

/**
 * Hooks used by the system.
 */
AH.hooks = Object.freeze({

  /**
   * Foundry-s own hooks.
   */
  foundry: Object.freeze({

    combat: {
      combatStart: "combatStart",
      combatRound: "combatRound",
      combatTurn: "combatTurn",
    },
  }),

  /**
   * @description Dispatched when system control tools are being initialized.
   */
  REGISTER_SYSTEM_TOOLS: `${systemID}.getSystemControlTools`,
  /**
   * @description Dispatched when system control tools are being initialized.
   */
  REGISTER_SYSTEM_SETTINGS_BUTTON: `${systemID}.getSystemSettingsButtons`,
  /**
   * @description Dispatched when system control tools are being initialized.
   */
  REGISTER_KEYBINDINGS: `${systemID}.registerKeybinding`,

  /**
   * @description Dispatched when a check is being initialized.
   * @example callback(event)
   * @remarks Uses {@link PrepareCheckEvent}
   */
  PREPARE_CHECK_EVENT: `${systemNS}.events.actions.initialize`,
  /**
   * @desc Invoked when a check is being prepared.
   * @remarks Expected function signature is {@link CheckPrepareCallback}
   */
  PREPARE_CHECK: `${systemNS}.check.prepare`,
  /**
   * @desc Invoked when a check is being processed.
   * @remarks Expected function signature is {@link CheckResultCallback}
   */
  PROCESS_CHECK: `${systemNS}.check.process`,
  /**
   * @desc Invoked when a check is being rendered.
   * @remarks Expected function signature is {@link CheckRenderCallback}
   */
  RENDER_CHECK: `${systemNS}.check.render`,

  /**
   * @desc Invoked when an action is being processed.
   * @remarks Expected function signature is {@link ActionProcessCallback}
   */
  PROCESS_ACTION: `${systemNS}.actions.process`,
  /**
  /**
   * @desc Invoked when an action is being rendered.
   * @remarks Expected function signature is {@link ActionRenderCallback}
   */
  RENDER_ACTION: `${systemNS}.actions.render`,

  /**
   * @description Dispatched when a check is about to be performed.
   * @example callback(event)
   * @remarks Uses {@link PerformActionEvent}
   */
  PERFORM_ACTION_EVENT: `${systemNS}.events.actions.perform`,
  /**
   * @description Dispatched when a check has been resolved.
   * @example callback(event)
   * @remarks Uses {@link ResolveActionEvent}
   */
  RESOLVE_ACTION_EVENT: `${systemNS}.events.actions.resolve`,
  /**
   * @description Dispatched when a check is about to be rendered.
   * @example callback(event)
   * @remarks Uses {@link RenderActionEvent}
   */
  RENDER_ACTION_EVENT: `${systemNS}.events.actions.render`,
  /**
   * @description Dispatched after a character gains an opportunity
   * @example callback(event)
   * @remarks Uses {@link OpportunityEvent}
   */
  OPPORTUNITY_EVENT: `${systemNS}.events.opportunity`,

  /**
   * @description Dispatched when a resource is to be spent to perform an action.
   * @example callback(event)
   * @remarks Uses {@link CalculateExpenseEvent}.
   */
  CALCULATE_EXPENSE_EVENT: `${systemNS}.events.expense.calculate`,
  /**
   * @description Dispatched when a request to apply damage is being processed.
   * @example callback(event)
   * @remarks Uses {@link CalculateDamageEvent}
   */
  CALCULATE_DAMAGE_EVENT: `${systemNS}.events.damage.calculate`,
  /**
   * @description Invoked after damage has been applied to an actor
   * @example callback(event)
   * @remarks Uses {@link DamageEvent}
   */
  APPLY_DAMAGE_EVENT: `${systemNS}.events.damage.apply`,
  /**
   * @description Dispatched when a request to apply a resource change is being processed.
   * @example callback(event)
   * @remarks Uses {@link CalculateResourceEvent}
   */
  CALCULATE_RESOURCE_EVENT: `${systemNS}.events.resource.calculate`,
  /**
   * @description Invoked when there's a change in the combat state
   * @example callback(event)
   * @remarks Uses {@link CombatEvent}
   */
  COMBAT_EVENT: `${systemNS}.events.combat`,
  /**
   * @description Dispatched after a progress tracker has been updated.
   * @example callback(event)
   * @remarks Uses {@link TrackEvent}
   */
  TRACK_EVENT: `${systemNS}.events.track`,

  /**
   * @description Invoked after damage has been applied to an actor
   * @example callback(event)
   * @remarks Uses {@link DamageEvent}
   */
  DAMAGE_EVENT: `${systemNS}.events.damage`,
  /**
   * @description Dispatched after an actor has a status effect applied or removed on them.
   * @example callback(event)
   * @remarks Uses {@link StatusEvent}. It happens AFTER the status effect has been applied.
   */
  STATUS_EVENT: `${systemNS}.events.status`,
  /**
   * @description Dispatched after an actor enters crisis.
   * @example callback(event)
   * @remarks Uses {@link CrisisEvent}. This can happen after a {@link DAMAGE_EVENT}.
   */
  CRISIS_EVENT: `${systemNS}.events.crisis`,
  /**
   * @description Invoked after an actor is reduced to 0 hit points
   * @example callback(event)
   * @remarks Uses {@link DefeatEvent}. This can happen after a {@link DAMAGE_EVENT}.
   */
  DEFEAT_EVENT: `${systemNS}.events.defeat`,
});

/**
 * @typedef {'humanoid'|'beast'|'undead'|'construct'} AH_Family The adversary classification.
 */

/**
 * @typedef {'action'|'reaction'} AH_ActionType
 */

AH.actionTypes = Object.freeze({
  action: { label: "AH.ACTION.Action" },
  reaction: { label: "AH.ACTION.Reaction" },
  activity: { label: "AH.ACTION.Activity" },
});

/**
 * Traits are tags with mechanical implications in the system.
 * @property {Record<String, AH_Constant>} action
 * @property {Record<String, AH_Constant>} damage
 * @property {Record<String, AH_Constant>} attack
 * @property {Record<String, AH_Constant>} defense
 * @property {Record<String, AH_Constant>} skill
 * @property {Record<String, AH_Constant>} weapon
 * @property {Record<String, AH_Constant>} armor
 */
AH.traits = {
  // General Traits
  general: {
    attack: { label: "AH.TRAIT.Attack", tooltip: "AH.TRAIT.AttackHint" },
    spell: { label: "AH.TRAIT.Spell", tooltip: "AH.TRAIT.SpellHint" },
    skill: { label: "AH.TRAIT.Skill", tooltip: "AH.TRAIT.SkillHint" },

    action: { label: "AH.TRAIT.Action", tooltip: "AH.TRAIT.ActionHint" },
    reaction: { label: "AH.TRAIT.Reaction", tooltip: "AH.TRAIT.ReactionHint" },
    maneuver: { label: "AH.TRAIT.Maneuver", tooltip: "AH.TRAIT.ManeuverHint" },

    damage: { label: "AH.TRAIT.Damage", tooltip: "AH.TRAIT.DamageHint" },
    restore: { label: "AH.TRAIT.Restore", tooltip: "AH.TRAIT.RestoreHint" },
  },

  // Action
  action: {
    cooldown: { label: "AH.TRAIT.Cooldown", tooltip: "AH.TRAIT.CooldownHint" },
    press: { label: "AH.TRAIT.Press", tooltip: "AH.TRAIT.PressHint" },
    opener: { label: "AH.TRAIT.Opener", tooltip: "AH.TRAIT.OpenerHint" },
    closer: { label: "AH.TRAIT.Closer", tooltip: "AH.TRAIT.CloserHint" },
    exhaust: { label: "AH.TRAIT.Exhaust", tooltip: "AH.TRAIT.ExhaustHint" },

    charge: { label: "AH.TRAIT.Charge", tooltip: "AH.TRAIT.ChargeHint" },
    channel: { label: "AH.TRAIT.Channel", tooltip: "AH.TRAIT.ChannelHint" },
    cast: { label: "AH.TRAIT.Cast", tooltip: "AH.TRAIT.CastHint" },

    shift: { label: "AH.TRAIT.Shift", tooltip: "AH.TRAIT.ShiftHint" },
    tension: { label: "AH.TRAIT.Tension", tooltip: "AH.TRAIT.TensionHint" },
    sustain: { label: "AH.TRAIT.Sustain", tooltip: "AH.TRAIT.SustainHint" },
    pressure: { label: "AH.TRAIT.Pressure", tooltip: "AH.TRAIT.PressureHint" },
    interrupt: { label: "AH.TRAIT.Interrupt", tooltip: "AH.TRAIT.InterruptHint" },
    free: { label: "AH.TRAIT.Free", tooltip: "AH.FreeHint" },
  },

  // Damage, Resource
  resource: {
    gain: { label: "AH.TRAIT.Gain", tooltip: "AH.TRAIT.GainHint" },
    loss: { label: "AH.TRAIT.Loss", tooltip: "AH.TRAIT.LossHint" },

    hp: { label: "AH.TRAIT.HitPoint", tooltip: "AH.TRAIT.HitPointHint" },
    mp: { label: "AH.TRAIT.MindPoint", tooltip: "AH.TRAIT.MindPointHint" },
    tp: { label: "AH.TRAIT.TensionPoint", tooltip: "AH.TRAIT.TensionPointHint" },
    ip: { label: "AH.TRAIT.InventoryPoint", tooltip: "AH.TRAIT.InventoryPointHint" },
    thp: { label: "AH.TRAIT.Block", tooltip: "AH.TRAIT.BlockHint" },
  },
  damage: {
    pressure: { label: "AH.TRAIT.Pressure", tooltip: "AH.TRAIT.PressureHint" },
    fixed: { label: "AH.TRAIT.Fixed", tooltip: "AH.TRAIT.FixedHint" },
    poison: { label: "AH.TRAIT.Poison", tooltip: "AH.TRAIT.PoisonHint" },
    mercy: { label: "AH.TRAIT.Mercy", tooltip: "AH.TRAIT.MercyHint" },
  },

  // Pressure
  pressure: {
    shift: { label: "AH.TRAIT.Shift", tooltip: "AH.TRAIT.ShiftHint" },
  },

  // Attack
  attack: {
    stress: { label: "AH.TRAIT.Stress", tooltip: "AH.TRAIT.StressHint" },
    reach: { label: "AH.TRAIT.Reach", tooltip: "AH.TRAIT.ReachHint" },
  },
  range: {
    melee: { label: "AH.TRAIT.Melee" },
    ranged: { label: "AH.TRAIT.Ranged" },
  },
  defense: {
    deflection: { label: "AH.TRAIT.Deflection", tooltip: "AH.TRAIT.DeflectionHint" }, // Heavy
    avoidance: { label: "AH.TRAIT.Avoidance", tooltip: "AH.TRAIT.AvoidanceHint" }, // Light
  },

  // Class traits
  class: {
    warrior: { label: "AH.TRAIT.Warrior", tooltip: "AH.TRAIT.WarriorHint" },
    mage: { label: "AH.TRAIT.Mage", tooltip: "AH.TRAIT.MageHint" },
    support: { label: "AH.TRAIT.Support", tooltip: "AH.TRAIT.SupportHint" },

    offense: { label: "AH.TRAIT.Offense", tooltip: "AH.TRAIT.OffenseHint" },
    defense: { label: "AH.TRAIT.Defense", tooltip: "AH.TRAIT.DefenseHint" },
    endurance: { label: "AH.TRAIT.Endurance", tooltip: "AH.TRAIT.EnduranceHint" },
    mobility: { label: "AH.TRAIT.Mobility", tooltip: "AH.TRAIT.MobilityHint" },
    stealth: { label: "AH.TRAIT.Stealth", tooltip: "AH.TRAIT.StealthHint" },
    tension: { label: "AH.TRAIT.Tension", tooltip: "AH.TRAIT.TensionHint" },
    shift: { label: "AH.TRAIT.Shift", tooltip: "AH.TRAIT.ShiftHint" },
    perception: { label: "AH.TRAIT.Perception", tooltip: "AH.TRAIT.PerceptionHint" },

    sniper: { label: "AH.TRAIT.Sniper", tooltip: "AH.TRAIT.SniperHint" },
    lore: { label: "AH.TRAIT.Lore", tooltip: "AH.TRAIT.LoreHint" },
    tactics: { label: "AH.TRAIT.Tactics", tooltip: "AH.TRAIT.Tactics" },
    dance: { label: "AH.TRAIT.Dance", tooltip: "AH.TRAIT.DanceHint" },
    music: { label: "AH.TRAIT.Music", tooltip: "AH.TRAIT.MusicHint" },
    alchemy: { label: "AH.TRAIT.Alchemy", tooltip: "AH.TRAIT.AlchemyHint" },
    mechanism: { label: "AH.TRAIT.Mechanism", tooltip: "AH.TRAIT.MechanismHint" },

    companion: { label: "AH.TRAIT.Companion", tooltip: "AH.TRAIT.CompanionHint" },
  },
  // Class feature traits
  feature: {
    performance: { label: "AH.TRAIT.Performance", tooltip: "AH.TRAIT.PerformanceHint" },
    dance: { label: "AH.TRAIT.Dance", tooltip: "AH.TRAIT.DanceHint" },
    song: { label: "AH.TRAIT.Song", tooltip: "AH.TRAIT.SongHint" },
    combo: { label: "AH.TRAIT.Combo", tooltip: "AH.TRAIT.ComboHint" },
    finisher: { label: "AH.TRAIT.Finisher", tooltip: "AH.TRAIT.FinisherHint" },
    chain: { label: "AH.TRAIT.Chain", tooltip: "AH.TRAIT.ChainHint" },
  },

  // Targeting trait
  target: {
    cleave: { label: "AH.TARGETING.AREA.Cleave", tooltip: "AH.TRAIT.CleaveHint" },
    pierce: { label: "AH.TARGETING.AREA.Pierce", tooltip: "AH.TRAIT.PierceHint" },
    splash: { label: "AH.TARGETING.AREA.Splash", tooltip: "AH.TRAIT.SplashHint" },
  },

  // Equipment
  weapon: {
    reach: { label: "AH.TRAIT.Reach", tooltip: "AH.TRAIT.ReachHint" },
    projectile: { label: "AH.TRAIT.Projectile", tooltip: "AH.TRAIT.ProjectileHint" },
    reload: { label: "AH.TRAIT.Reload", tooltip: "AH.TRAIT.ReloadHint" },
    draw: { label: "AH.TRAIT.Draw", tooltip: "AH.TRAIT.DrawHint" },
    thrown: { label: "AH.TRAIT.Thrown", tooltip: "AH.TRAIT.ThrownHint" },
    shield: { label: "AH.TRAIT.Shield", tooltip: "AH.TRAIT.ShieldHint" },
    brawl: { label: "AH.TRAIT.Brawl", tooltip: "AH.TRAIT.BrawlHint" },
  },
  armor: {
    stable: { label: "AH.TRAIT.Stable", tooltip: "AH.TRAIT.StableHint" }, // Shifting resistance
    fleet: { label: "AH.TRAIT.Fleet", tooltip: "AH.TRAIT.FleetHint" }, // Improved shifting
    flexible: { label: "AH.TRAIT.Flexible", tooltip: "AH.TRAIT.FlexibleHint" }, //
    comfort: { label: "AH.TRAIT.Comfort", tooltip: "AH.TRAIT.ComfortHint" }, // Improves stress recovery
    storage: { label: "AH.TRAIT.Storage", tooltip: "AH.TRAIT.StorageHint" }, // Easy access to items
  },
  consumable: {
    potion: { label: "AH.TRAIT.Potion", tooltip: "AH.TRAIT.PotionHint" },
  },
  family: {
    beast: { label: "AH.ADVERSARY.FAMILY.Beast" }, // Natural
    monster: { label: "AH.ADVERSARY.FAMILY.Monster" }, // Unnatural
    undead: { label: "AH.ADVERSARY.FAMILY.Undead" }, // Raised by dark powers
    construct: { label: "AH.ADVERSARY.FAMILY.Construct" }, // Engineered
    elemental: { label: "AH.ADVERSARY.FAMILY.Elemental" },
    plant: { label: "AH.ADVERSARY.FAMILY.Plant" },
  },
};

/**
 * @typedef {'reach'|'projetile'|'reload'|'thrown'} AH_WeaponTrait
 */

/**
 * @typedef {'light'|'heavy'} AH_ArmorTrait
 */

//  Create a catch-all of traits for localization purposes
AH.traits.all = Object.freeze({
  ...AH.traits.general,
  ...AH.traits.action,
  ...AH.traits.damage,
  ...AH.traits.resource,
  ...AH.traits.attack,
  ...AH.traits.defense,
  ...AH.traits.skill,
  ...AH.traits.range,
  ...AH.traits.weapon,
  ...AH.traits.armor,
  ...AH.traits.target,
  ...AH.domains,
  ...AH.damageTypes,
  ...AH.speed,
});
Object.freeze(AH.traits);

/**
 * All registered icons classes.
 * @type {Record<String, String>}
 */
AH.icons = {
  compendium: "fas fa-book",
  documents: "fa fa-book-bookmark",

  class: "ah-icon-class",
  level: "ah-icon-level",
  hp: "ah-icon-hp",
  mp: "ah-icon-mp",
  ip: "ah-icon-ip",
  tp: "ah-icon-tp",
  thp: "ah-icon-thp",
  block: "ah-icon-thp",
  pp: "ah-icon-pp",

  def: "ah-icon-def",
  mdef: "ah-icon-mdef",
  init: "ah-icon-init",

  mig: "ah-icon-might",
  dex: "ah-icon-dexterity",
  ins: "ah-icon-insight",
  wlp: "ah-icon-willpower",

  untyped: "ah-icon-untyped",
  slashing: "ah-icon-slashing",
  piercing: "ah-icon-piercing",
  bludgeoning: "ah-icon-bludgeoning",

  fire: "ah-icon-fire",
  cold: "ah-icon-cold",
  electric: "ah-icon-electric",
  acid: "ah-icon-acid",
  light: "ah-icon-light",
  dark: "ah-icon-dark",
  mental: "ah-icon-mental",
  poison: "ah-icon-poison",

  attack: "ah-icon-attack",
  ability: "ah-icon-ability",
  feature: "fa fa-puzzle-piece",

  skill: "ah-icon-skill",
  spell: "ah-icon-spell",
  defend: "ah-icon-defend",
  item: "ah-icon-inventory",
  equipment: "ah-icon-equipment",
  objective: "ah-icon-objective",
  rest: "ah-icon-rest-long",

  maneuver: "ah-icon-maneuver",
  recover: "ah-icon-recover",

  shortRest: "ah-icon-rest-short",
  longRest: "ah-icon-rest-long",
  resupply: "ah-icon-resupply",

  gain: "fa fa-chevron-circle-up",
  loss: "fa fa-chevron-circle-down",
  effect: "ah-icon-effect",

  // Pipeline
  applyDamage: "ah-icon-damage",

  popout: "fa fa-external-link",
  pin: "fa fa-thumb-tack",
  bookmark: "fa fa-bookmark-o",
  add: "fa fa-plus",
  remove: "fa fa-minus",
  plus: "fa fa-plus",
  minus: "fa fa-minus",
  edit: "fa fa-pencil",
  undo: "fa fa-undo",
  redo: "fa fa-redo",
  inspect: "fa fa-eye",
  link: "fa fa-link",
  reset: "fa fa-reset",
  refresh: "fa fa-refresh",
  broken: "fas fa-chain-broken",
  type: "fa-solid fa-shapes",
  amount: "fa-solid fa-calculator",
  duration: "fa fa-stopwatch",
  origin: "fa fa-map-marker-alt",
  properties: "fa fa-tags",
  message: "fas fa-message",
  dice: "ra ra-perspective-dice-six",
  open: "fas fa-open",
  close: "fas fa-close",

  roll: "ah-icon-check-roll",
  hr: "ah-icon-check-hr",
  modifier: "ah-icon-check-modifier",
  difficulty: "ah-icon-check-difficulty",
  result: "ah-icon-check-result",
  target: "ah-icon-target",

  // Field Types
  action: "fas fa-hand-fist",
  attributes: "fas fa-sliders",
  weapon: "fas fa-gun",
  usage: "fas fa-gun",
  damage: "fas fa-explosion",
  resource: "fas fa-battery-three-quarters",
  cost: "fas fa-tag",
  effects: "fas fa-wand-magic-sparkles",
  check: "fas fa-dice-d20",
  options: "fas fa-gear",
  targeting: "fas fa-bullseye",

  openCheck: "ah-icon-check-open",
  attributeCheck: "ah-icon-check-attribute",
  actionCheck: "ah-icon-check-action",
  defenseCheck: "ah-icon-check-defense",
  ritualCheck: "ah-icon-check-ritual",

  reduced: "ra ra-level-two",
  standard: "ra ra-level-three",
  powerful: "ra ra-level-four",

  parameter: "fa-solid fa-sliders",
  additive: "fa-solid fa-plus",
  multiplicative: "fa-solid fa-xmark",
  affinity: "fa-solid fa-bolt",

  current: "fa-solid fa-plus",
  maximum: "fa-solid fa-minus",

  full: "fa fa-hourglass",
  half: "fa fa-hourglass-half",
  empty: "fa fa-hourglass-start",

  start: "fa fa-hourglass-start",
  end: "fa fa-hourglass-end",

  info: "fas fa-circle-info",
  warning: "fas fa-triangle-exclamation",
  help: "fas fa-circle-question",

  send: "fas fa-comment",
  equip: "fa fa-hand-fist",
  unequip: "fa fa-hand",

  push: "fa-solid fa-arrow-up-right-from-square",
  pull: "fa-solid fa-cloud-arrow-down",

};

export default AH;
