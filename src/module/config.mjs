// NOTE: This file should have no other dependencies
import { systemAssetPath, systemNS } from "./constants.mjs";

const AH = {};

/** @import { SettingConfig } from "@client/_types.mjs" */

const fields = foundry.data.fields;

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
 * @type {Object<AH_Attribute, string>}
 */
AH.attributes = {
  mig: "AH.CHARACTER.Might",
  dex: "AH.CHARACTER.Dexterity",
  ins: "AH.CHARACTER.Insight",
  wlp: "AH.CHARACTER.Willpower",
};

AH.attributeDice = {
  4: "AH.DICE.D4",
  6: "AH.DICE.D6",
  8: "AH.DICE.D8",
  10: "AH.DICE.D10",
  12: "AH.DICE.D12",
};

/**
 * @typedef {"attribute", "open"} CheckType
 */

/**
 * @type {Object<CheckType, string>}
 */
AH.checkTypes = {
  attribute: "AH.CHECK.Attribute",
  open: "AH.CHECK.Open",
};

/**
 * @desc The set of ability scores used for characters in the system.
 * @typedef {"hp", "mp", "tp", "ip"} AH_Resource
 */

AH.resources = {
  hp: "AH.CHARACTER.HitPoint",
  mp: "AH.CHARACTER.MindPoint",
  ip: "AH.CHARACTER.InventoryPoint",
  tp: "AH.CHARACTER.TensionPoint",
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
 * @typedef {"def", "mdef", "dex", "ins", "mig", "wlp"} AH_Defense
 */

AH.defenses = Object.freeze({
  def: "AH.CHARACTER.Defense",
  mdef: "AH.CHARACTER.MagicDefense",
  dex: "AH.CHARACTER.Dexterity",
  ins: "AH.CHARACTER.Insight",
  wlp: "AH.CHARACTER.Willpower",
  mig: "AH.CHARACTER.Might",
});

/**
 * @typedef {'none' | 'startOfTurn' | 'endOfTurn' | 'endOfRound' | 'endOfScene' | 'rest'} Interval
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
   */
  PREPARE_CHECK: `${systemNS}.check.prepare`,
  /**
   * @desc Invoked when a check is being processed.
   */
  PROCESS_CHECK: `${systemNS}.check.process`,
  /**
   * @desc Invoked when a check is being rendered.
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

});

/**
 * All registered icons classes.
 * @type {Record<String, String>}
 */
AH.icons = {
  compendium: "fas fa-book",
  documents: "fa fa-book-bookmark",

  level: "fas fa-chart-simple",
  hp: "ra ra-hearts",
  mp: "ra ra-crystal-ball",
  ip: "ra ra-ammo-bag",
  tp: "ra ra-player-pyromaniac",

  def: "ra ra-heavy-shield",
  mdef: "ra ra-bolt-shield",
  init: "ra ra-clockwork",

  mig: "ra ra-muscle-up",
  dex: "ra ra-boot-stomp",
  ins: "ra ra-aware",
  wlp: "ra ra-hearts",

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

  roll: "ra ra-perspective-dice-six",
  modifier: "ra ra-lever",
  difficulty: "ra ra-mountains",

  openCheck: "fa-solid fa-lock-open",
  attributeCheck: "fa-solid fa-lock",

  full: "fa fa-hourglass",
  half: "fa fa-hourglass-half",
  start: "fa fa-hourglass-start",
  end: "fa fa-hourglass-end",

  info: "fas fa-circle-info",
  warning: "fas fa-triangle-exclamation",
  help: "fas fa-circle-question",

  send: "fas fa-comment",
};

export default AH;
