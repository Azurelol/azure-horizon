export const systemID = "azure-horizon";

/**
 * Translates repository paths to Foundry Data paths.
 * @param {string} path - A path relative to the root of this repository.
 * @returns {string} The path relative to the Foundry data folder.
 */
export const systemPath = (path) => `systems/${systemID}/${path}`;

/**
 * Translates asset paths to Foundry Data asset paths.
 * @param {string} path - A path relative to the asset directory of this repository.
 * @returns {string} The asset directory to path relative to the Foundry data folder.
 */
export const systemAssetPath = (path) => `systems/${systemID}/assets/${path}`;

/**
 * Gets a system setting.
 * @param {String} key
 * @param defaultValue
 * @returns {*|undefined}
 */
export function getSystemSetting(key, defaultValue = undefined) {
  return game.settings.get(systemID, key) || defaultValue;
}

/**
 * Sets a system setting.
 * @param {String} key
 * @param value
 * @return {Promise}
 */
export function setSystemSetting(key, value) {
  return game.settings.set(systemID, key, value);
}
