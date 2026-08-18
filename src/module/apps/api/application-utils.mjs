import { CompendiumBrowser } from "../ui/_module.mjs";

/**
 * @this
 * @param {PointerEvent} event   The originating click event
 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
 * @returns {Promise<void>}
 */
async function openCompendium(event, target) {
  const tab = target.dataset.tab;
  return CompendiumBrowser.open(tab, {
    ...target.dataset,
  });
}

/**
 * @description Provides utility functions for rendering sheets
 */
const ApplicationUtils = Object.freeze({
  /**
   * @desc Common actions across sheets.
   */
  actions: {
    openCompendium,
  },
});
