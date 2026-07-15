// NOTE: This file should have no other dependencies
import { systemAssetPath } from "./constants.mjs";

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
 * @type {Object<Attribute, string>}
 */
AH.attributes = {
  mig: "AH.CHARACTER.Might",
  dex: "AH.CHARACTER.Dexterity",
  ins: "AH.CHARACTER.Insight",
  wlp: "AH.CHARACTER.Willpower",
};

/**
 * @desc The set of ability scores used for characters in the system.
 * @typedef {"hp", "mp", "tp", "ip"} AH_Parameter
 */

AH.parameters = {
  hp: {
    long: "AH.CHARACTER.Long",
  },

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
 * All registered icons classes.
 * @type {Record<String, String>}
 */
AH.icons = {
  compendium: "fas fa-book",
  documents: "fa fa-book-bookmark",

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

  info: "fas fa-circle-info",
  warning: "fas fa-triangle-exclamation",
  help: "fas fa-circle-question",
};

export default AH;
