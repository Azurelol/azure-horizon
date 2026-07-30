import { ActionConfig, TextEditorHelper } from "../../helpers/_module.mjs";
import { Targeting } from "../../helpers/targeting.mjs";
import AH from "../../config.mjs";
import { StringUtils } from "../../utils/_module.mjs";
import { EvaluationContext, Flags } from "../../data/common/_module.mjs";
import { systemID } from "../../constants.mjs";
import { Events, Expressions, Resources } from "../_module.mjs";
import { ResourceRequest } from "../resources.mjs";

const RESOURCE_GAIN_IDENTIFIER = "ResourceGain";
const RESOURCE_LOSS_IDENTIFIER = "ResourceGain";

function createReplacementElement(amount, type, tooltip, label, change) {
  if (type in AH.resources) {
    const anchor = TextEditorHelper.anchor();
    anchor.dataset.type = type;

    let typeName = StringUtils.localize(`${AH.resources[type]}.short`);
    anchor.setAttribute("data-tooltip", `${StringUtils.localize(tooltip)} (${amount} ${typeName})`);
    anchor.draggable = true;
    anchor.dataset.change = change;

    // ICON
    TextEditorHelper.icon(anchor, type);
    // INDICATOR
    TextEditorHelper.icon(anchor, change);

    if (label) {
      anchor.append(StringUtils.localize(label));
      anchor.dataset.label = label;
      anchor.dataset.amount = amount;
    } else {
      // AMOUNT
      TextEditorHelper.amount(anchor, amount);
      // TYPE
      anchor.append(` ${typeName}`);
    }

    return anchor;
  } else {
    return null;
  }
}

/**
 * @param {HTMLElement} element
 * @returns {Promise<void>}
 */
async function onRender(element) {
  const renderContext = await TextEditorHelper.getRenderContext(element);
  const target = element.firstElementChild;
  const type = renderContext.dataset.type;

  element.addEventListener("click", async function () {
    const targets = await Targeting.getSelected();
    if (targets.length > 0) {
      let context = EvaluationContext.fromSourceInfo(renderContext.sourceInfo, targets);

      let check = renderContext.document.getFlag(systemID, Flags.ChatMessage.Check);
      if (check) {
        context = context.withCheck(check);
      }

      let amount = await Expressions.evaluateAsync(renderContext.dataset.amount, context);

      if (context.actor && check) {
        const config = new ActionConfig(check);
        config.setResource(type, amount);
        const updateData = config.getResource();
        await Events.calculateResource(context.actor, context.item, config, updateData);
        amount = updateData.total;
      }

      if (renderContext.dataset.change === "loss") {
        amount = -amount;
      }
      const request = new ResourceRequest(renderContext.sourceInfo, targets, type, amount);
      await Resources.process(request);
    }
  });

  // element.addEventListener("dragstart", function (event) {
  //   const data = {
  //     type: target.classList.contains(classInlineRecovery) ? INLINE_RECOVERY : INLINE_LOSS,
  //     sourceInfo: renderContext.sourceInfo,
  //     recoveryType: renderContext.dataset.type,
  //     amount: renderContext.dataset.amount,
  //     uncapped: renderContext.dataset.uncapped === "true",
  //   };
  //
  //   event.dataTransfer.setData("text/plain", JSON.stringify(data));
  //   event.stopPropagation();
  // });
}

/**
 * @type {TextEditorEnricherConfig}
 */
const gainEnricher = {
  id: "InlineRecovery",
  pattern: TextEditorHelper.pattern("GAIN", "\\s*(?<amount>\\(?.*?\\)*?)\\s(?<type>\\w+?)"),
  enricher: function(text, options) {
    const amount = text[1];
    const type = text[2];
    const label = text.groups.label;
    return createReplacementElement(amount, type.toLowerCase(), "AH.PIPELINE.ResourceGain", label, "gain");
  },
  onRender: onRender,
};

/**
 * @type {TextEditorEnricherConfig}
 */
const lossEnricher = {
  id: "InlineLoss",
  pattern: TextEditorHelper.pattern("LOSS", "\\s*(?<amount>\\(?.*?\\)*?)\\s(?<type>\\w+?)"),
  enricher: function(text, options) {
    const amount = text[1];
    const type = text[2];
    const label = text.groups.label;
    return createReplacementElement(amount, type.toLowerCase(), "AH.PIPELINE.ResourceLoss", label, "loss");
  },
  onRender: onRender,
};

/**
 * @type {AH_TextEditorEnrichment}
 */
const ResourceTextEditorEnricher = Object.freeze({
  enrichers: [gainEnricher, lossEnricher],
});

export default ResourceTextEditorEnricher;
