import { TextEditorHelper } from "../../helpers/_module.mjs";
import AH from "../../config.mjs";

/**
 * @param {RegExpMatchArray} match The text within a chat message that matches the given pattern
 * @param {*} options
 * @returns A formatted html element
 */
function enricher(match, options) {
  const amount = match[1];
  const type = match[2].toLowerCase();
  const label = match.groups.label;
  const traits = match.groups.traits;

  if (type in AH.damageTypes) {

  }
}

/**
 * @param {HTMLElement} element
 * @returns {Promise<void>}
 */
async function onRender(element) {
}

/**
 * @type TextEditorEnricherConfig
 */
const config = {
  id: "DamageTextEditorEnricher",
  pattern: TextEditorHelper.pattern("DMG", "\\s*(?<amount>\\(?.*?\\)*?)\\s(?<type>\\w+?)"),
  enricher: enricher,
  onRender: onRender,
};

/**
 * @type {AH_TextEditorEnrichment}
 */
const DamageTextEditorEnricher = Object.freeze({
  enrichers: [config],
});

export default DamageTextEditorEnricher;
