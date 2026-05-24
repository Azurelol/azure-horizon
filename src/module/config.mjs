import { systemAssetPath } from "./constants.mjs";

const AH = {};

/** @import { SettingConfig } from "@client/_types.mjs" */

const fields = foundry.data.fields;

/**
 * @type {Record<String, String>}
 */
AH.themes = {
  default: "AH.THEMES.Default",
};

/**
 * @type {Record<String, String>}
 */
AH.themeFiles = {
  default: systemAssetPath("themes/default.json"),
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
    name: "AH.Setting.Theme.Label",
    hint: "AH.Setting.Theme.Hint",
    type: Object,
    requiresReload: false,
    default: null,
    scope: "world",
  },
});

export default AH;
