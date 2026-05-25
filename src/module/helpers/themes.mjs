import { getSystemSetting, systemAssetPath } from "../constants.mjs";
import Theme from "./theme.mjs";
import AH from "../config.mjs";

/**
 * @typedef ThemeEntry
 * @property {String} label
 * @property {Theme} theme
 */

/**
 * @type {Record<String, ThemeEntry>} Instantiated themes.
 */
let systemThemes;

/**
 * @param filePath
 * @returns {Promise<any>}
 */
async function readJsonFromSystemFile(filePath) {
  const response = await fetch(filePath);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Manages setting the system's theme.
 */
export default class Themes {

  /**
   * @param {Boolean} reload
   * @returns {Promise<Record<String, ThemeEntry>>}
   */
  static async getSystemThemes(reload = false) {
    if (!systemThemes || reload) {
      systemThemes = {};
      for (const [key, filePath] of Object.entries(AH.themeFiles)) {
        const json = await readJsonFromSystemFile(filePath);
        if (json) {
          const label = AH.themes[key];
          systemThemes[key] = {
            label: label,
            theme: json,
          };
        }
      }
    }
    return systemThemes;
  }

  /**
   * @desc Convenient factory method for getting a Theme instance from passed in data.
   * @param {*} themeData
   * @returns {Theme} The passed in themeData if it was already an instance of Theme, or a Theme generated from the themeData.
   */
  static from(themeData) {
    return themeData instanceof Theme ? themeData : new Theme(themeData);
  }

  /**
   * Initializes the system theme, if one has been set.
   */
  static async initialize() {
    let themeData = getSystemSetting("theme");

    // Fall back to default theme if none is set
    if (!themeData) {
      const themes = await this.getSystemThemes();
      themeData = themes.default.theme;
    }

    if (themeData) {
      const theme = Themes.from(themeData);
      if (theme) {
        theme.apply();
      }
    }
  }
}
