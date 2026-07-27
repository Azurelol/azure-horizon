import AH from "../../config.mjs";
import { StringUtils } from "../../utils/_module.mjs";
import { TextEditorHelper } from "../../helpers/_module.mjs";

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
    const anchor = TextEditorHelper.anchor();
    anchor.dataset.type = type;
    anchor.dataset.traits = traits;
    if (label) {
      anchor.dataset.label = label;
    }
    anchor.draggable = true;

    // 1. DAMAGE ICON
    TextEditorHelper.icon(anchor, "damage");
    // 2. LABEL
    if (label) {
      anchor.append(label);
      anchor.dataset.amount = amount;
    } else {
      TextEditorHelper.amount(anchor, amount);
      anchor.append(` ${StringUtils.localize(AH.damageTypes[type].label)}`);
    }
    // 3. DAMAGE TYPE ICON
    TextEditorHelper.icon(anchor, type);
    return anchor;
  }

  return null;
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
  pattern: "", // TextEditorHelper.pattern("DMG", "\\s*(?<amount>\\(?.*?\\)*?)\\s(?<type>\\w+?)"),
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
