import { getSystemSetting, systemAssetPath } from "../constants.mjs";
import Theme from "./theme.mjs";
import AH from "../config.mjs";

/**
 * @type {Record<String, Object>} Instantiated themes.
 */
let systemThemes;

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
  static async getSystemThemes(reload = false) {
    if (!systemThemes || reload) {
      systemThemes = {};
      for (const [label, filePath] of Object.entries(AH.themeFiles)) {
        const json = await readJsonFromSystemFile(filePath);
        if (json) {
          systemThemes[label] = json;
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
  static initialize() {
    const themeData = getSystemSetting("theme");
    if (themeData) {
      const theme = Themes.from(themeData);
      if (theme) {
        theme.apply();
      }
    }
  }
}
