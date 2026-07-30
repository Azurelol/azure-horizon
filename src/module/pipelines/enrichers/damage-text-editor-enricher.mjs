import { systemID } from "../../constants.mjs";
import { HTMLUtils, StringUtils, TextEditorUtils } from "../../utils/_module.mjs";
import AH from "../../config.mjs";
import { Targeting } from "../../helpers/targeting.mjs";
import { EvaluationContext } from "../../data/common/_module.mjs";
import Flags from "../../data/common/flags.mjs";
import { Damage, DamageData, DamageRequest, Expressions } from "../_module.mjs";

/**
 * @param {RegExpMatchArray} match The text within a chat message that matches the given pattern
 * @param {*} options
 * @returns A formatted html element
 */
function enricher(match, options) {
  const amount = match[1];
  const type = match[2]?.toLowerCase();
  const label = match.groups.label;
  const traits = match.groups.traits;

  if (type in AH.damageTypes) {
    const anchor = TextEditorUtils.anchor();
    anchor.dataset.type = type;
    anchor.dataset.traits = traits;
    if (label) {
      anchor.dataset.label = label;
    }
    anchor.draggable = true;

    // 1. DAMAGE ICON
    TextEditorUtils.icon(anchor, "damage");
    // 2. LABEL
    if (label) {
      anchor.append(label);
      anchor.dataset.amount = amount;
    } else {
      TextEditorUtils.amount(anchor, amount);
      anchor.append(` ${StringUtils.localize(AH.damageTypes[type].label)}`);
    }
    // 3. DAMAGE TYPE ICON
    TextEditorUtils.icon(anchor, type);
    return anchor;
  }

  return null;
}

/**
 * @param {HTMLElement} element
 * @returns {Promise<void>}
 */
async function onRender(element) {
  const renderContext = await TextEditorUtils.getRenderContext(element);
  element.addEventListener("click", async function(event) {
    const keyboardModifiers = HTMLUtils.getKeyboardModifiers(event);
    let targets = await Targeting.getSelected();
    if (targets.length > 0) {
      let context = EvaluationContext.fromSourceInfo(renderContext.sourceInfo, targets);
      let check = renderContext.document.getFlag(systemID, Flags.ChatMessage.Check);
      if (check) {
        context = context.withCheck(check);
      }
      const type = renderContext.dataset.type;
      let amount = await Expressions.evaluateAsync(renderContext.dataset.amount, context);
      let traits = [];
      let damageData = new DamageData();
      damageData.add(type, amount);

      const request = new DamageRequest(renderContext.sourceInfo, targets, damageData);
      request.addTraits(traits);
      if (renderContext.dataset.traits) {
        request.addTraits(...renderContext.dataset.traits.split(","));
      }

      await Damage.process(request);
    }
  });
}

/**
 * @type TextEditorEnricherConfig
 */
const config = {
  id: "DamageTextEditorEnricher",
  pattern: TextEditorUtils.pattern("DMG", "\\s*(?<amount>\\(?.*?\\)*?)\\s(?<type>\\w+?)"),
  enricher,
  onRender,
};

/**
 * @type {AH_TextEditorEnrichment}
 */
const DamageTextEditorEnricher = Object.freeze({
  enrichers: [config],
});

export default DamageTextEditorEnricher;
