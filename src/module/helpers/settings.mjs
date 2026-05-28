import { systemID } from "../constants.mjs";
import AH from "../config.mjs";
import { ThemeMenu } from "../apps/menus/_module.mjs";

/**
 * @typedef SettingConfig
 * A Client Setting
 * @property {string} key             A unique machine-readable id for the setting.
 * @property {string} namespace       The namespace the setting belongs to.
 * @property {string} name            The human-readable name.
 * @property {string} hint            An additional human-readable hint.
 * @property {"world"|"client"|"user"} scope  The scope the Setting is stored in, either World, Client, or User.
 * @property {boolean} config         Indicates if this Setting should render in the Config application.
 * @property {BuiltinType|DataField|typeof DataModel} type The type of data stored by this Setting.
 * @property {Object} [choices]       For string Types, defines the allowable values.
 * @property {Object} [range]         For numeric Types, defines the allowable range.
 * @property {any} [default]          The default value.
 * @property {Function} [onChange]    Executes when the value of this Setting changes.
 * @property {CustomFormInput} [input] A custom form field input used in conjunction with a DataField type.
 * @property {string} [id]            The combination of `{namespace}.{key}`.
 */

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
        name: "AH.SETTING.ThemeName",
        label: "AH.SETTING.ThemeLabel",
        hint: "AH.SETTING.ThemeHint",
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
