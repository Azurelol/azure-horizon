import { systemID } from "../constants.mjs";
import Flags from "../data/common/flags.mjs";
import {
  ChatMessageBuilder,
  ChatMessageHelper,
  ChatSectionOrder,
  FlagBuilder,
} from "../helpers/_module.mjs";
import { ObjectUtils, StringUtils, TokenUtils } from "../utils/_module.mjs";
import PipelineRequest from "./pipeline-request.mjs";

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
  const message = request.gain ? "AH.PIPELINE.ChatResourceGain" : "AH.PIPELINE.ChatResourceLoss";
  const fieldPath = `parameters.${request.resource}`;
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
    flags.toggle(request.gain ? Flags.ChatMessage.ResourceGain : Flags.ChatMessage.ResourceLoss);
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
        const message = incomingRecoveryMultiplier > 0 ? "AH.PIPELINE.ChatRecoveryNotNeeded" : "AH.PIPELINE.ChatRecoveryNotPossible";
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
  if (!message.getFlag(systemID, Flags.ChatMessage.Damage)) {
    return;
  }

  // TODO: Update
  ChatMessageHelper.handleClickRevert(message, html, "revertResource", async (dataset) => {
    const uuid = dataset.uuid;
    const actor = fromUuidSync(uuid);
    const updates = [];
    const amountRecovered = Number(dataset.amount);
    const resource = dataset.resource.toLowerCase();
    updates.push(actor.modifyTokenAttribute(`parameters.${resource}`, amountRecovered, true));
    TokenUtils.showFloatyText(actor, `${amountRecovered} ${resource}`, "lightgreen");
    return Promise.all(updates);
  });
}

/**
 * Initializes the callback handlers for this pipeline.
 */
function initialize() {
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
}

const Resources = Object.freeze({
  initialize,
  process,
});

export default Resources;
