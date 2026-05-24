import { systemID } from "../constants.mjs";
import AH from "../config.mjs";
import { ThemeMenu } from "../apps/menus/_module.mjs";

/** @import { SettingConfig } from "@client/_types.mjs" */

const fields = foundry.data.fields;

/**
 * Helper class for setting registration.
 * Never actually constructed, only used to group static methods.
 */
export default class Settings {
  /**
   * All settings associated with the system.
   * @type {Record<string, SettingConfig>}
   */
  static get systemSettings() {
    return AH.settings;
  }

  /**
   * All settings associated with the system.
   * @type {Record<string, SettingMenu>}
   */
  static get menus() {
    return {
      themeOptions: {
        name: "AH.MENUS.ThemeName",
        label: "AH.MENUS.ThemeLabel",
        hint: "AH.MENUS.ThemeHint",
        icon: "fas fa-bars",
        type: ThemeMenu,
        restricted: true,
      },
    };
  }

  /**
   * Helper function called in the `init` hook.
   */
  static initialize() {
    // Initialize settings
    for (const [key, value] of Object.entries(this.systemSettings)) {
      game.settings.register(systemID, key, value);
    }
    // Initialize menus
    for (const [key, value] of Object.entries(this.menus)) {
      game.settings.registerMenu(systemID, key, value);
    }
  }
}
