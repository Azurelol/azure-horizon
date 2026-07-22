/**
 * The system string identifier, used by Foundry.
 * @type {string}
 */
export const systemID = "azure-horizon";

/**
 * The system namespace, used as a prefix for hooks and the like.
 * @type {string}
 */
export const systemNS = "ah";

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
 * Translates template paths to Foundry Data asset paths.
 * @param {string} path - A path relative to the template directory of this repository.
 * @returns {string} The template directory to path relative to the Foundry data folder.
 */
export const systemTemplatePath = (path) => `systems/${systemID}/templates/${path}.hbs`;

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

/**
 * @param {String} templatePath The path relative to the system's templates directory.
 * @param {Object} context Used by the template.
 * @returns {Promise<*>}
 */
export async function renderTemplate(templatePath, context) {
  return await foundry.applications.handlebars.renderTemplate(systemTemplatePath(templatePath), context);
}
