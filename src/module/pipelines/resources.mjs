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
import ResourceData from "./resource-data.mjs";

/**
 * @property {AH_Resource} resource
 * @property {Boolean} gain
 * @property {ResourceData} data
 * @extends PipelineRequest
 * @inheritDoc
 */
export class ResourceRequest extends PipelineRequest {

  /**
   * @param {SourceInfo} sourceInfo
   * @param {AHActor[]} targets
   * @param {ResourceData} data
   */
  constructor(sourceInfo, targets, data) {
    super(sourceInfo, targets);
    this.data = data;
    this.gain = data.isPositive;
  }

  /**
   * @returns {AH_Resource}
   */
  get resource() {
    return this.data.type;
  }
}

/**
 * @param {ResourceRequest} request
 * @return {Promise<Awaited<unknown>[]>}
 */
async function process(request) {

  // Some constants
  const fieldPath = `resources.${request.data.type}`;
  const updates = [];

  console.debug(`Applying resource change from request with traits: ${[...request.traits].join(", ")}`);

  for (const subject of request.targets) {
    if (!subject.isOwner) {
      ui.notifications.warn("AH.DIALOG.WARNINGS.DocumentOwnership", { localize: true });
      continue;
    }

    // Get the resource property
    /** @type ActorResourceDataModel **/
    const resource = ObjectUtils.getProperty(subject.system, fieldPath);

    // The chat message to be generated
    const flags = new FlagBuilder();
    flags.toggle(AH.flags.ChatMessage.Resource);
    const chatMessage = new ChatMessageBuilder(subject, request.item).withFlags(flags);

    // Evaluate modifiers from the request
    const context = new EvaluationContext(subject, request.item, request.targets, request.sourceInfo);
    let amount = 0;
    for (const mod of request.data.modifiers) {
      const ma = await Expressions.evaluateAsync(mod.amount, context);
      amount += ma;
    }

    // TEMP
    if (request.data.temp) {
      // Check whether the incoming temp gain is less than the current
      if (amount < resource.temporary) {
        chatMessage.text(StringUtils.localize("AH.CHAT.TemporaryResourceLess", {
          actor: subject.name,
          resource: request.resource.toUpperCase(),
        }));
        await chatMessage.create();
        continue;
      }
    }
    else {
      // GAIN
      if (request.gain) {
        // Apply modifiers from the character's parameters
        const outgoingRecoveryBonus = 0; // request.actor?.system.bonuses.outgoingRecovery[request.resourceType] || 0;
        const outgoingRecoveryMultiplier = 1; //request.actor?.system.multipliers.outgoingRecovery[request.resourceType] || 1;
        const incomingRecoveryBonus = 0; //subject.system.bonuses.incomingRecovery[request.resourceType] || 0;
        const incomingRecoveryMultiplier = 1; //subject.system.multipliers.incomingRecovery[request.resourceType] ?? 1;
        amount = Math.max(0, Math.floor((amount + incomingRecoveryBonus + outgoingRecoveryBonus) * (incomingRecoveryMultiplier * outgoingRecoveryMultiplier)));

        // Cap the amount gained up to the maximum
        amount = Math.min(amount, resource.max - resource.value);
        if (amount === 0) {
          const message = incomingRecoveryMultiplier > 0 ? "AH.CHAT.RecoveryNotNeeded" : "AH.CHAT.RecoveryNotPossible";
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
        // Apply modifiers from the character's parameters
        const incomingLossBonus = 0; // actor.system.bonuses.incomingLoss[request.resourceType] || 0;
        const incomingLossMultiplier = 1; // actor.system.multipliers.incomingLoss[request.resourceType] || 1;
        amount = -Math.max(0, Math.floor((Math.abs(amount) + incomingLossBonus) * incomingLossMultiplier));
      }
    }

    // Create the resource update
    const message = request.gain ? "AH.CHAT.ResourceGain" : "AH.CHAT.ResourceLoss";
    if (request.data.temp) {
      const previous = resource.temporary;
      updates.push(subject.update({ [`system.${fieldPath}.temporary`]: amount }).then(async (actor) => {
        chatMessage.template(
          "chat/chat-section-update-resource-temporary",
          {
            message: message,
            actor: subject.name,
            uuid: subject.uuid,
            previous: previous,
            gain: request.gain,
            amount: amount,
            resource: "Block",
            from: request.sourceInfo.name,
            change: request.gain ? "gain" : "loss",
          },
          ChatSectionOrder.description,
        );
        await chatMessage.create();
      }));
    }
    else {
      updates.push(
        subject.modifyTokenAttribute(fieldPath, amount, true).then(async (actor) => {
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
            ChatSectionOrder.description,
          );
          await chatMessage.create();
          TokenUtils.showFloatyText(subject, `${amount} ${request.resource.toUpperCase()}`, "lightgreen");
          return actor;
        }),
      );
    }

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
    /** @type ResourceData **/
    const data = new ResourceData(fields.data);
    const amount = fields.amount;
    const type = fields.type;
    const targets = await ChatAction.getTargetsFromAction(dataset);
    const traits = fields.traits;
    const request = new ResourceRequest(sourceInfo, targets, data);
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
 * @param {PotencyActionOptions} options
 * @returns {ChatAction}
 */
function getChatAction(request, options = {}) {
  let resourceIcon;
  if (request.data.temp && (request.resource === "hp")) {
    resourceIcon = AH.icons.thp;
  } else {
    resourceIcon = AH.resourceTypes[request.resource].icon;
  }

  const label = StringUtils.localize(request.gain ? "AH.CHAT.ResourceGainLabel" : "AH.CHAT.ResourceLossLabel", {
    amount: request.data.toString(),
  });
  const tooltip = StringUtils.localize(request.gain ? "AH.CHAT.ResourceGainTooltip" : "AH.CHAT.ResourceLossTooltip", {
    amount: request.data.toString(),
    resource: StringUtils.localize(request.data.temp ? AH.resourceTypes[request.resource].temporary : AH.resourceTypes[request.resource].label),
  });

  const action = new ChatAction("updateResource", resourceIcon, tooltip, {
    type: request.resource,
    data: request.data,
    sourceInfo: request.sourceInfo,
    traits: Array.from(request.traits),
  })
    .requiresOwner()
    .setFlag(AH.flags.ChatMessage.Resource)
    .withColor(request.gain ? "var(--color-hp)" : "var(--color-hp-crisis)")
    .withTraits(Array.from(request.traits));

  if (options.potency) {
    action.withDataset({
      potency: options.potency,
    });

    if (options.selected) {
      action.withSelected();
    }

    if (options.label) {
      action.withLabel(label);
    }
  }
  else {
    action.withSelected();
    action.withLabel(label);
  }

  return action;
}

/**
 * @param {ResourceExpense} expense
 * @param sourceInfo
 * @returns {ChatAction}
 */
function getExpenseAction(expense, sourceInfo) {
  const resourceIcon = AH.resourceTypes[expense.resource].icon;

  const label = StringUtils.localize("AH.CHAT.SpendResource", {
    amount: expense.amount,
  });
  const tooltip = StringUtils.localize("AH.CHAT.SpendResourceHint", {
    amount: expense.amount,
    resource: StringUtils.localize(AH.resourceTypes[expense.resource].label),
  });

  const data = ResourceData.initialize(expense.resource, -expense.amount);
  return new ChatAction("updateResource", resourceIcon, tooltip, {
    amount: -expense.amount,
    type: expense.resource,
    data: data,
    sourceInfo: sourceInfo,
  })
    .requiresOwner()
    .setFlag(AH.flags.ChatMessage.Resource)
    .withLabel(label)
    .withTraits(["loss"])
    .notTargeted()
    .withSelected();
}

/** @type ActionProcessCallback **/
const onProcessAction = async (config, actor, item, registerCallback) => {
  const targets = Targeting.deserializeTargetData(config.getTargets());
  const context = EvaluationContext.fromTargetData(actor, item, targets);

  // RESOURCE: General chat action
  if (config.hasResource) {
    await Events.calculateResource(actor, item, config);
    const resourceData = config.resource;
    const request = new ResourceRequest(config.sourceInfo, targets, resourceData);
    config.addAction(getChatAction(request));
  }

  // EXPENSES
  const expenses = config.expenses;
  if (expenses.length > 0) {
    for (const expense of expenses) {
      const itemGroup = ItemInfo.resolveItemGroup(item);
      const _amount = await Expressions.evaluateAsync(expense.amount, context);
      expense.amount = _amount * (expense.perTarget ? Math.max(1, targets.length) : 1);
      expense.source = itemGroup;
      await Events.calculateExpense(actor, item, targets, expense);
      config.addAction(getExpenseAction(expense, config.sourceInfo));
    }
  }

  // TRAITS
  if (config.hasTrait("stress")) {
    const stressData = ResourceData.initialize("tp", 1);
    const request = new ResourceRequest(config.sourceInfo, targets, stressData);

    if (actor.type === "hero") {
      config.addAction(getChatAction(request));
    }
    else if (actor.type === "adversary") {
      if (config.isCheck) {
        config.setPotency(potency => {
          potency.standard.components.push({
            actions: [getChatAction(request, {
              potency: "standard",
            })],
          });
          potency.powerful.components.push({
            actions: [getChatAction(request, {
              potency: "powerful",
            })],
          });
        });
      }
    }
  }
};

/** @type ActionRenderCallback **/
const onRenderAction = (config, data, actor, item, registerCallback) => {
  if (config.hasResource) {
  }
};

/**
 * Initializes the callback handlers for this pipeline.
 */
function initialize() {
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
  Hooks.on(AH.hooks.PROCESS_ACTION, (config, actor, item, registerCallback) =>
  {
    registerCallback(onProcessAction);
  });
  Hooks.on(AH.hooks.RENDER_ACTION, onRenderAction);
}

const Resources = Object.freeze({
  initialize,
  process,
});

export default Resources;
