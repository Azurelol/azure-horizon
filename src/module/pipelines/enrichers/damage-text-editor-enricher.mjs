import { systemID } from "../../constants.mjs";
import { HTMLUtils, StringUtils, TextEditorUtils } from "../../utils/_module.mjs";
import AH, { scaleValue } from "../../config.mjs";
import Targeting from "../../helpers/targeting.mjs";
import { EvaluationContext, SourceInfo } from "../../data/common/_module.mjs";
import Flags from "../../data/common/flags.mjs";
import { Damage, DamageData, DamageRequest, Expressions } from "../_module.mjs";

const ID = "DamageTextEditorEnricher";

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
      TextEditorUtils.amount(anchor, amount, true);
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
      let damageData = DamageData.initialize({
        type,
        amount,
      });

      const request = new DamageRequest(renderContext.sourceInfo, targets, damageData);
      request.addTraits(traits);
      if (renderContext.dataset.traits) {
        request.addTraits(...renderContext.dataset.traits.split(","));
      }

      await Damage.process(request);
    }
  });

  // Handle dragstart
  element.addEventListener("dragstart", async function (event) {
    const sourceInfo = SourceInfo.resolve(document, renderContext.target);
    const data = {
      type: ID,
      _sourceInfo: sourceInfo,
      damageType: renderContext.dataset.type,
      amount: renderContext.dataset.amount,
      traits: renderContext.dataset.traits,
    };

    event.dataTransfer.setData("text/plain", JSON.stringify(data));
    event.stopPropagation();
  });
}

/**
 * @type TextEditorEnricherConfig
 */
const config = {
  id: ID,
  pattern: TextEditorUtils.pattern("DMG", "\\s*(?<amount>\\(?.*?\\)*?)\\s(?<type>\\w+?)"),
  enricher,
  onRender,
};

async function onDropActor(actor, sheet, { type, damageType, amount, _sourceInfo, traits, ignore }) {
  if (type === ID) {
    // Need to rebuild the class after it was deserialized
    const sourceInfo = SourceInfo.fromObject(_sourceInfo);
    const context = EvaluationContext.fromSourceInfo(sourceInfo, [actor]);
    const _amount = await Expressions.evaluateAsync(amount, context);
    const damageData = DamageData.initialize(
      {
        type: damageType,
        amount: _amount,
      },
    );

    const request = new DamageRequest(sourceInfo, [actor], damageData);
    if (traits) {
      request.addTraits(...traits.split(","));
    }

    await Damage.process(request);
    return false;
  }
}

/**
 * @type {AH_TextEditorEnrichment}
 */
const DamageTextEditorEnricher = Object.freeze({
  enrichers: [config],
  onDropActor,
});

export default DamageTextEditorEnricher;
