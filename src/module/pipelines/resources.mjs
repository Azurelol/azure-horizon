import { systemID, systemTemplatePath } from "../constants.mjs";
import Flags from "../data/common/flags.mjs";
import {
  ChatAction,
  ChatMessageBuilder,
  ChatMessageHelper,
  ChatSectionOrder,
  FlagBuilder,
} from "../helpers/_module.mjs";
import { ObjectUtils, StringUtils, TokenUtils } from "../utils/_module.mjs";
import PipelineRequest from "./pipeline-request.mjs";
import { EvaluationContext, ItemInfo, SourceInfo } from "../data/common/_module.mjs";
import AH from "../config.mjs";
import Events from "./events.mjs";
import { Expressions } from "./_module.mjs";
import Targeting from "../helpers/targeting.mjs";

/**
 * @property {AH_Resource} resource
 * @property {Number} amount
 * @property {Boolean} gain
 * @extends PipelineRequest
 * @inheritDoc
 */
export class ResourceRequest extends PipelineRequest {

  /**
   * @param {SourceInfo} sourceInfo
   * @param {AHActor[]} targets
   * @param {AH_Resource} resource
   * @param {Number} amount
   */
  constructor(sourceInfo, targets, resource, amount) {
    super(sourceInfo, targets);
    this.resource = resource;
    this.gain = amount >= 0;
    this.amount = amount;
  }
}

/**
 * @param {ResourceRequest} request
 * @return {Promise<Awaited<unknown>[]>}
 */
async function process(request) {

  // Some constants
  const message = request.gain ? "AH.PIPELINE.CHAT.ResourceGain" : "AH.PIPELINE.CHAT.ResourceLoss";
  const fieldPath = `resources.${request.resource}`;
  const updates = [];

  console.debug(`Applying resource change from request with traits: ${[...request.traits].join(", ")}`);

  for (const subject of request.targets) {
    if (!subject.isOwner) {
      ui.notifications.warn("AH.DIALOG.WARNINGS.DocumentOwnership", { localize: true });
      continue;
    }

    // Get the resource property
    const resource = ObjectUtils.getProperty(subject.system, fieldPath);

    // The chat message to be generated
    const flags = new FlagBuilder();
    flags.toggle(AH.flags.ChatMessage.Resource);
    const chatMessage = new ChatMessageBuilder(subject, request.item).withFlags(flags);

    let amount;

    // GAIN
    if (request.gain) {
      const outgoingRecoveryBonus = 0; // request.actor?.system.bonuses.outgoingRecovery[request.resourceType] || 0;
      const outgoingRecoveryMultiplier = 1; //request.actor?.system.multipliers.outgoingRecovery[request.resourceType] || 1;
      const incomingRecoveryBonus = 0; //subject.system.bonuses.incomingRecovery[request.resourceType] || 0;
      const incomingRecoveryMultiplier = 1; //subject.system.multipliers.incomingRecovery[request.resourceType] ?? 1;
      amount = Math.max(0, Math.floor((request.amount + incomingRecoveryBonus + outgoingRecoveryBonus) * (incomingRecoveryMultiplier * outgoingRecoveryMultiplier)));
      // Cap the amount gained up to the maximum
      amount = Math.min(amount, resource.max - resource.value);
      if (amount === 0) {
        const message = incomingRecoveryMultiplier > 0 ? "AH.PIPELINE.CHAT.RecoveryNotNeeded" : "AH.PIPELINE.CHAT.RecoveryNotPossible";
        chatMessage.text(StringUtils.localize(message, {
          actor: subject.name,
          resource: request.resource.toUpperCase(),
        }));
        await chatMessage.create();
        continue;
      }
    }
    // LOSS
    else {
      const incomingLossBonus = 0; // actor.system.bonuses.incomingLoss[request.resourceType] || 0;
      const incomingLossMultiplier = 1; // actor.system.multipliers.incomingLoss[request.resourceType] || 1;
      amount = -Math.max(0, Math.floor((Math.abs(request.amount) + incomingLossBonus) * incomingLossMultiplier));
    }

    // Create the resource update
    updates.push(
      subject.modifyTokenAttribute(fieldPath, amount, true).then(async (result) => {
        chatMessage.template(
          "chat/chat-section-update-resource",
          {
            message: message,
            actor: subject.name,
            uuid: subject.uuid,
            gain: request.gain,
            amount: amount,
            resource: request.resource,
            from: request.sourceInfo.name,
            change: request.gain ? "gain" : "loss",
          },
          ChatSectionOrder.details,
        );
        await chatMessage.create();
        TokenUtils.showFloatyText(subject, `${amount} ${request.resource.toUpperCase()}`, "lightgreen");
        return result;
      }),
    );
  }
  return Promise.all(updates);
}

/**
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
function onRenderChatMessage(message, html) {
  if (!message.getFlag(systemID, AH.flags.ChatMessage.Resource)) {
    return;
  }

  ChatMessageHelper.handleClick(message, html, "updateResource", async (dataset) => {
    const fields = StringUtils.fromBase64(dataset.fields);
    const sourceInfo = SourceInfo.fromObject(fields.sourceInfo);
    const amount = fields.amount;
    const type = fields.type;
    const targets = await ChatAction.getTargetsFromAction(dataset);
    const traits = fields.traits;
    const request = new ResourceRequest(sourceInfo, targets, type, amount);
    if (traits) {
      request.addTraits(traits);
    }
    return process(request);
  });

  ChatMessageHelper.handleClickRevert(message, html, "revertResource", async (dataset) => {
    const uuid = dataset.uuid;
    const actor = fromUuidSync(uuid);
    const updates = [];
    const amountRecovered = Number(dataset.amount);
    const resource = dataset.resource.toLowerCase();
    updates.push(actor.modifyTokenAttribute(`resources.${resource}`, amountRecovered, true));
    TokenUtils.showFloatyText(actor, `${amountRecovered} ${resource}`, "lightgreen");
    return Promise.all(updates);
  });
}

/**
 * @param {ResourceRequest} request
 * @returns {ChatAction}
 */
function getChatAction(request) {
  const resourceIcon = AH.resourceTypes[request.resource].icon;
  const tooltip = StringUtils.localize(request.gain ? "AH.PIPELINE.CHAT.ResourceGainTooltip" : "AH.PIPELINE.CHAT.ResourceLossTooltip", {
    amount: request.amount,
    resource: StringUtils.localize(AH.resourceTypes[request.resource].long),
  });

  return new ChatAction("updateResource", resourceIcon, tooltip, {
    amount: request.amount,
    type: request.resource,
    sourceInfo: request.sourceInfo,
    traits: Array.from(request.traits),
  })
    .requiresOwner()
    .setFlag(AH.flags.ChatMessage.Resource)
    .withLabel(tooltip)
    .withColor(request.gain ? "var(--color-hp)" : "var(--color-hp-crisis)")
    .withTraits(Array.from(request.traits))
    .withSelected();
}

/** @type ActionProcessCallback **/
const onProcessAction = async (config, actor, item, registerCallback) => {
  const targets = Targeting.deserializeTargetData(config.getTargets());

  // RESOURCE: General chat action
  if (config.hasResource) {
    await Events.calculateResource(actor, item, config);
    const resourceData = config.resource;
    const request = new ResourceRequest(config.sourceInfo, targets, resourceData.type, resourceData.total);
    config.addAction(getChatAction(request));
  }

  // EXPENSES
  const expenses = config.expenses;
  if (expenses.length > 0) {
    for (const expense of expenses) {
      const itemGroup = ItemInfo.resolveItemGroup(item);
      const context = EvaluationContext.fromTargetData(actor, item, targets);
      const _amount = await Expressions.evaluateAsync(expense.amount, context);
      expense.amount = _amount * (expense.perTarget ? Math.max(1, targets.length) : 1);
      expense.source = itemGroup;
      await Events.calculateExpense(actor, item, targets, expense);
    }
  }
};

/** @type ActionRenderCallback **/
const onRenderAction = (config, data, actor, item, registerCallback) => {
  if (config.hasResource) {
    // data.sections.push({
    //   order: ChatSectionOrder.damage,
    //   partial: systemTemplatePath("chat/chat-section-update-resource"),
    //   data: {
    //   },
    // });
  }
};

/**
 * Initializes the callback handlers for this pipeline.
 */
function initialize() {
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
  Hooks.on(AH.hooks.PROCESS_ACTION, onProcessAction);
  Hooks.on(AH.hooks.RENDER_ACTION, onRenderAction);
}

const Resources = Object.freeze({
  initialize,
  process,
});

export default Resources;
