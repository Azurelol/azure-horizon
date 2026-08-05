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
export const systemTemplatePath = (path) => {
  return `systems/${systemID}/templates/${path}.hbs`;
};

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
 * @param {Boolean} relative If the path is relative to the templates directory. If not, the translation will be applied.
 * @returns {Promise<*>}
 */
export async function renderTemplate(templatePath, context, relative = true) {
  const path = relative ? systemTemplatePath(templatePath) : templatePath;
  return await foundry.applications.handlebars.renderTemplate(path, context);
}

/**
 * Helper function that reduces path length for enrichment calls and improves default handling.
 * Enrich HTML content by replacing or augmenting components of it.
 * @param {string} content                  The original HTML content (as a string).
 * @param {EnrichmentOptions} [options={}]  Additional options which configure how HTML is enriched.
 * @returns {Promise<string>}               The enriched HTML content.
 */
export async function enrichHTML(content, options = {}) {
  // Override document-related options with the relative document's info
  if (options.relativeTo) {
    // Don't reveal secrets of unowned documents, but allow explicit false to prevent sharing secrets of owned documents
    if (options.secrets !== false) options.secrets = options.relativeTo.isOwner;
    if (typeof options.relativeTo.getRollData === "function") options.rollData = options.relativeTo.getRollData();
  }
  return foundry.applications.ux.TextEditor.implementation.enrichHTML(content, options);
}

/**
 * @param {DataModel} document
 * @return {Boolean}
 */
export function isActorType(document) {
  return document.documentName === "Actor";
}

/**
 * @param {DataModel} document
 * @return {Boolean}
 */
export function isItemType(document) {
  return document.documentName === "Item";
}
