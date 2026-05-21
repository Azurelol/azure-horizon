import { getSystemSetting, systemAssetPath } from "../constants.mjs";
import Theme from "./theme.mjs";

/**
 * @type {Record<String, Object>} Instantiated themes.
 */
let systemThemes;

const themeFiles = Object.freeze({
  Default: systemAssetPath("themes/default.json"),
});

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
      for (const [label, filePath] of Object.entries(themeFiles)) {
        const json = await readJsonFromSystemFile(filePath);
        if (json) {
          systemThemes[label] = json;
        }
      }
    }
    return systemThemes;
  }

  static initialize() {
    Theme.from(getSystemSetting("theme")).apply();
  }
}
