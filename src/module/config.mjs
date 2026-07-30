// NOTE: This file should have no other dependencies
import { systemAssetPath, systemNS } from "./constants.mjs";

const AH = {};

/** @import { SettingConfig } from "@client/_types.mjs" */

const fields = foundry.data.fields;

/**
 * @typedef AH_Constant
 * @property {String|undefined} label
 * @property {String|undefined} long
 * @property {String|undefined} short
 * @property {String} icon
 */

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
    minimum: 5,
    maximum: 99,
  },
});

/**
 * @desc The set of ability scores used for characters in the system.
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
 * @typedef {"attribute"|"open"|'action'} CheckType
 */

/**
 * @type {Object<CheckType, string>}
 */
AH.checkTypes = {
  attribute: "AH.CHECK.Attribute",
  open: "AH.CHECK.Open",
  action: "AH.CHECK.Action",
};

/**
 * @desc The set of ability scores used for characters in the system.
 * @typedef {"hp"|"mp"|"tp"| "ip"} AH_Resource
 */

AH.resources = {
  hp: { label: "AH.CHARACTER.HitPoint.short" },
  mp: { label: "AH.CHARACTER.MindPoint.short" },
  ip: { label: "AH.CHARACTER.InventoryPoint.short" },
  tp: { label: "AH.CHARACTER.TensionPoint.short" },
};

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
 * @typedef {'physical'|'elemental'|'spiritual'} AH_DamageGroup
 */

AH.damageGroups = Object.freeze({
  physical: "AH.DAMAGE.Physical",
  elemental: "AH.DAMAGE.Elemental",
  spiritual: "AH.DAMAGE.Spiritual",
});

/**
 * @typedef {'slashing'|'piercing'|'blunt'|'fire'|'cold'|'electric'|'acid'|'light'|'dark'|'mental'|'poison'} AH_DamageType
 */

/**
 * @typedef AH_DamageTypeMetadata
 * @property {String} label
 * @property {AH_DamageGroup} group
 */

/**
 * @type {Record<String, AH_DamageTypeMetadata>}
 */
AH.damageTypes = Object.freeze({
  untyped: { label: "AH.DAMAGE.Untyped", group: null },

  slashing: { label: "AH.DAMAGE.Slashing", group: "physical" },
  piercing: { label: "AH.DAMAGE.Piercing", group: "physical" },
  blunt: { label: "AH.DAMAGE.Blunt", group: "physical" },

  fire: { label: "AH.DAMAGE.Fire", group: "elemental" },
  cold: { label: "AH.DAMAGE.Cold", group: "elemental" },
  electric: { label: "AH.DAMAGE.Electric", group: "elemental" },
  acid: { label: "AH.DAMAGE.Acid", group: "elemental" },

  light: { label: "AH.DAMAGE.Light", group: "spiritual" },
  dark: { label: "AH.DAMAGE.Dark", group: "spiritual" },

  mental: { label: "AH.DAMAGE.Mental", group: null },
  poison: { label: "AH.DAMAGE.Poison", group: null },
});

/**
 * @typedef {"def"|"mdef"|"dex"|"ins"|"mig"|"wlp"} AH_Defense
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
 * @typedef {"character"|"party"|"adversary"|"unit"} AH_ActorType
 */

/**
 * @typedef {'weapon'|'skill'|'spell'|'consumable'} AH_ItemType
 */

AH.itemType = {
  weapon: "AH.ITEM.Weapon",
  skill: "AH.ITEM.Skill",
};

/**
 * @typedef {"attack" | "skill" | "spell" | "item"} AH_ItemGroup
 */

AH.itemGroup = {
  attack: "AH.ITEM.Attack",
  skill: "AH.ITEM.Skill",
  spell: "AH.ITEM.Spell",
  item: "AH.ITEM.Item",
};

/**
 * @description How the active effect's duration is tracked
 * @type {{self: string, source: string}}
 */
AH.effectTracking = {
  self: "AH.COMMON.Self",
  source: "AH.COMMON.Source",
};

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
    name: "AH.SETTING.ThemeLabel",
    hint: "AH.SETTING.ThemeHint",
    type: Object,
    requiresReload: false,
    default: null,
    scope: "world",
  },
  codexUploadDirectory: {
    name: "AH.SETTING.UploadDirectory",
    hint: "AH.SETTING.UploadDirectoryHint",
    scope: "world",
    config: true,
    type: String,
    filePicker: "folder",
  },
});

/**
 * Hooks used by the system.
 */
AH.hooks = Object.freeze({
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
   * @description Dispatched when a check is being initialized.
   * @example callback(event)
   * @remarks Uses {@link InitializeActionEvent}
   */
  INITIALIZE_ACTION_EVENT: `${systemNS}.events.actions.initialize`,
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
   * @description Dispatched when a request to apply damage is being processed.
   * @example callback(event)
   * @remarks Uses {@link CalculateDamageEvent}
   */
  CALCULATE_DAMAGE_EVENT: `${systemNS}.events.damage.calculate`,
  /**
   * @description Dispatched when a request to apply a resource change is being processed.
   * @example callback(event)
   * @remarks Uses {@link CalculateResourceEvent}
   */
  CALCULATE_RESOURCE_EVENT: "projectfu.events.resource.calculate",
});

/**
 * All registered icons classes.
 * @type {Record<String, String>}
 */
AH.icons = {
  compendium: "fas fa-book",
  documents: "fa fa-book-bookmark",

  level: "fas fa-chart-simple",
  hp: "ah-icon-hp",
  mp: "ah-icon-mp",
  ip: "ah-icon-ip",
  tp: "ah-icon-tp",

  def: "ah-icon-def",
  mdef: "ah-icon-mdef",
  init: "ra ra-clockwork",

  mig: "ah-icon-might",
  dex: "ah-icon-dexterity",
  ins: "ah-icon-insight",
  wlp: "ah-icon-willpower",

  untyped: "ra ra-perspective-dice-random",
  slashing: "ah-icon-slashing",
  piercing: "ah-icon-piercing",
  blunt: "ah-icon-blunt",
  fire: "ah-icon-fire",
  cold: "ah-icon-cold",
  electric: "ah-icon-electric",
  acid: "ah-icon-acid",
  light: "ah-icon-light",
  dark: "ah-icon-dark",
  mental: "ah-icon-mental",
  poison: "ah-icon-poison",

  shortRest: "ah-icon-rest-short",
  longRest: "ah-icon-rest-long",
  resupply: "ah-icon-resupply",

  gain: "fa fa-chevron-circle-up",
  loss: "fa fa-chevron-circle-down",

  popout: "fa fa-external-link",
  pin: "fa fa-thumb-tack",
  bookmark: "fa fa-bookmark-o",
  add: "fa fa-plus",
  remove: "fa fa-minus",
  edit: "fa fa-pencil",
  undo: "fa fa-undo",
  redo: "fa fa-redo",
  inspect: "fa fa-eye",
  link: "fa fa-link",
  reset: "fa fa-reset",
  refresh: "fa fa-refresh",
  check: "fa fa-check",

  roll: "ah-icon-check-roll",
  modifier: "ah-icon-check-modifier",
  difficulty: "ah-icon-check-difficulty",
  result: "ah-icon-check-result",
  damage: "ah-icon-damage",
  openCheck: "ah-icon-check-open",
  attributeCheck: "ah-icon-check-attribute",

  full: "fa fa-hourglass",
  half: "fa fa-hourglass-half",
  empty: "fa fa-hourglass-start",

  start: "fa fa-hourglass-start",
  end: "fa fa-hourglass-end",

  info: "fas fa-circle-info",
  warning: "fas fa-triangle-exclamation",
  help: "fas fa-circle-question",

  send: "fas fa-comment",
};

export default AH;
