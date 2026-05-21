import { systemID } from "../constants.mjs";

/** @import { SettingConfig } from "@client/_types.mjs" */

const fields = foundry.data.fields;

/**
 * Helper class for setting registration.
 * Never actually constructed, only used to group static methods.
 */
export default class SettingsHandler {
  /**
   * All settings associated with the system.
   * @type {Record<string, SettingConfig>}
   */
  static get systemSettings() {
    return {
      migrationVersion: {
        name: "AH.Setting.MigrationVersion.Label",
        hint: "AH.Setting.MigrationVersion.Hint",
        type: new fields.StringField({ required: true }),
        default: "",
        scope: "world",
      },
    };
  }

  /**
   * Helper function called in the `init` hook.
   */
  static initialize() {
    for (const [key, value] of Object.entries(this.systemSettings)) {
      game.settings.register(systemID, key, value);
    }
  }
}
