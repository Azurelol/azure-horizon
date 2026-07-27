import { implementations } from "./enrichers/_module.mjs";

/**
 * @typedef EnrichmentOptions
 * @property {boolean} [secrets=false]      Include unrevealed secret tags in the final HTML? If false, unrevealed
 *                                          secret blocks will be removed.
 * @property {boolean} [documents=true]     Replace dynamic document links?
 * @property {boolean} [links=true]         Replace hyperlink content?
 * @property {boolean} [rolls=true]         Replace inline dice rolls?
 * @property {boolean} [embeds=true]        Replace embedded content?
 * @property {boolean} [custom=true]        Apply custom enrichers?
 * @property {object|Function} [rollData]   The data object providing context for inline rolls, or a function that
 *                                          produces it.
 * @property {ClientDocument} [relativeTo]  A document to resolve relative UUIDs against.
 */

/**
 * @callback TextEditorEnricher
 * @param {RegExpMatchArray} match          The regular expression match result
 * @param {EnrichmentOptions} [options]     Options provided to customize text enrichment
 * @returns {Promise<HTMLElement|null>}     An HTML element to insert in place of the matched text or null to
 *                                          indicate that no replacement should be made.
 */

/**
 * @typedef TextEditorEnricherConfig
 * @property {string} [id]                  A unique ID to assign to the enricher type. Required if you want to use
 *                                          the onRender callback.
 * @property {RegExp} pattern               The string pattern to match. Must be flagged as global.
 * @property {TextEditorEnricher} enricher  The function that will be called on each match. It is expected that this
 *                                          returns an HTML element to be inserted into the final enriched content.
 * @property {boolean} [replaceParent]      Hoist the replacement element out of its containing element if it replaces
 *                                          the entire contents of the element.
 * @property {function(HTMLEnrichedContentElement)} [onRender]  An optional callback that is invoked when the
 *                                          enriched content is added to the DOM.
 */

/**
 * @typedef HTMLEnrichedContentElement
 * @extends HTMLElement
 */

/**
 * @typedef AH_TextEditorEnrichment
 * @property {TextEditorEnricherConfig[]} enrichers
 * @property onDropActor
 */

const Enrichers = Object.freeze({
  initialize: async () => {
    for (const impl of Object.values(implementations))
    {
      if (impl.onDropActor) {
        Hooks.on("dropActorSheetData", impl.onDropActor);
      }
      CONFIG.TextEditor.enrichers.push(...impl.enrichers);
    }
  },
});

export default Enrichers;
