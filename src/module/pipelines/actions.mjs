import Events from "./events.mjs";
import { ActionConfig, ActionInspector } from "../helpers/action-configuration.mjs";
import AH from "../config.mjs";
import {
  ChatAction,
  ChatMessageBuilder,
  ChatMessageHelper,
  ChatMessageSections,
  FlagBuilder,
} from "../helpers/_module.mjs";
import Flags from "../data/common/flags.mjs";
import { SourceInfo } from "../data/common/_module.mjs";
import { renderTemplate, systemID } from "../constants.mjs";
import { StringUtils } from "../utils/_module.mjs";
import { CheckPrompt } from "../helpers/check-prompt.mjs";

/**
 * @typedef Action
 * @property {CheckId} id A unique identifier for this action.
 * @property {Object} data
 * @property {SourceInfo} sourceInfo
 */

/**
 * @callback ActionPrepareCallback
 * @param {ActionConfig} config
 * @param {AHActor} actor
 * @param {AHItem} item
 * @return {Promise | void}
 */

/**
 * @callback ActionProcessCallback
 * @param {ActionConfig} config
 * @param {AHActor} actor
 * @param {AHItem} item
 * @return {Promise | void}
 */

/**
 * @callback ActionRenderCallback
 * @param {ActionConfig} config
 * @param {ChatMessageBuilderData} data
 * @param {AHActor} actor
 * @param {AHItem} item
 * @return {Promise | void}
 */

/**
 * @param {String} hook The name of the hook
 * @param {Partial<ActionConfig>} action
 * @param {AHActor} actor
 * @param {AHItem} item
 * @returns {Promise<void>}
 */
async function invokeWithCallbacks(hook, action, actor, item) {
  /**
   * @type {{callback: Promise | (() => Promise | void), priority: number}[]}
   */
  const callbacks = [];
  const registerCallbacks = (callback, priority = 0) => {
    callbacks.push({ callback, priority });
  };

  Hooks.callAll(hook, action, actor, item, registerCallbacks);

  callbacks.sort((a, b) => a.priority - b.priority);
  for (let callbackObj of callbacks) {
    await callbackObj.callback(action, actor, item);
  }
}

/**
 * @typedef DefenseCheckSourceData
 * @property id The id of the source action.
 * @property uuid The actor whose defense is being prompted.
 * @property actor The uuid of the attacker.
 * @property item The uuid of the item used in the attack.
 * @property difficulty
 * @property defense
 */

/**
 * @param {ActionConfig} config
 * @param {AHActor} actor
 * @param {AHItem} item
 * @returns {ChatAction}
 */
function getDefendAction(config, actor, item) {
  const defend = new ChatAction("defenseCheck", AH.icons.defenseCheck, "AH.CHECK.Defense");
  defend.withDataset({
    id: config.check.id,
    actor: actor.uuid,
    item: item.id,
    difficulty: config.check.total,
    defense: config.getTargetedDefense(),
  });
  defend.withFields({
    sourceInfo: config.sourceInfo,
  });
  defend.setFlag(AH.flags.ChatMessage.DefenseCheck);
  return defend;
}

/**
 * Adds common chat sections
 * @param {ChatMessageBuilderData} builderData
 * @param {ActionConfig} config
 * @param {AHActor} actor
 * @param {AHItem} item
 */
async function addSections(builderData, config, actor, item) {

  // ACTIONS
  if (config.actions.length > 0) {
    builderData.actions.push(...config.actions);
  }

  // TAGS
  const traits = config.getTraits();
  for (const trait of traits) {
    const traitProperties = AH.traits.all[trait];
    if (traitProperties) {
      builderData.tags.push({
        tag: traitProperties.label,
        tooltip: traitProperties.tooltip,
      });
    }
    else {
      builderData.tags.push({
        tag: StringUtils.capitalize(trait),
      });
      //ui.notifications.error(`Missing trait data for ${trait}`);
    }
  }
  for (const tag of config.tags) {
    builderData.tags.push(tag);
  }

  // TARGETS
  if (config.check.type === "action") {
    const targets = config.getTargets();
    const isTargeted = targets.length > 0;
    if (isTargeted) {
      if (config.isDefenseCheck) {
        const defendAction = getDefendAction(config, actor, item);
        builderData.actions.push(defendAction);
        ChatMessageSections.targetsDefend(builderData.sections, targets, [defendAction]);
      }
      else {
        ChatMessageSections.targets(builderData.sections, targets, [ChatAction.TARGET_ACTION]);
      }
    }
  }

  let fb = new FlagBuilder(builderData.flags);
  fb.set(Flags.ChatMessage.Source, config.sourceInfo);

  // POTENCY section
  const potencies = config.potencies;
  if (potencies) {
    for (const potency of [potencies.reduced, potencies.standard, potencies.powerful]) {
      for (const component of potency.components) {
        for (const action of component.actions) {
          fb.set(action.flag.key, action.flag.value).toObject();
        }
      }
    }
    ChatMessageSections.potencies(builderData.sections, potencies);
  }

  builderData.flags = fb.toObject();

  // FLAVOR
  let flavor;
  const defenseResults = config.defenseResults;
  const useItemFlavor = item && !defenseResults;
  if (useItemFlavor) {
    let linked = [];
    const weaponReference = config.weaponUsage?.weapon;
    if (weaponReference) {
      linked.push(await fromUuid(weaponReference));
    }
    flavor = await renderTemplate("chat/chat-section-flavor-item", {
      item: item,
      linked: linked,
    });
  } else {
    let flavorTitle = StringUtils.localize(AH.checkTypes[config.check.type] || "AH.CHECK.Check");
    const itemRef = config.getItemReference();
    let referencedItem;
    if (itemRef) {
      referencedItem = await fromUuid(itemRef);
      flavorTitle += ` - ${referencedItem.name}`;
    }
    flavor = await renderTemplate("chat/chat-section-flavor", {
      icon: AH.icons[`${config.check.type}Check`],
      title: flavorTitle,
      item: referencedItem,
      label: config.getLabel(),
    });
  }

  builderData.flavor = flavor;
}

/**
 * @param {ActionConfig} config
 * @param {AHActor} actor
 * @param {AHItem} item
 * @returns {Promise<void>}
 */
async function renderAction(config, actor, item) {
  /**
   * @type ChatMessageBuilderData
   */
  const builderData = {
    sections: [],
    postRenderActions: [],
    tags: [],
    flags: {},
    actions: [],
  };

  Hooks.callAll(AH.hooks.RENDER_ACTION, config, builderData, actor, item);
  await Events.renderAction(builderData, config, actor, item);
  await addSections(builderData, config, actor, item);
  const chatBuilder = new ChatMessageBuilder(actor, item).withData(builderData);
  // Create the chat message
  return chatBuilder.create();
}

/**
 * @param {AHActor} actor
 * @param {AHItem} item
 * @param {ActionPrepareCallback} prepare
 * @returns {Promise<void>}
 */
async function perform(actor, item, prepare) {
  /** @type Action **/
  const action = {
    id: foundry.utils.randomID(),
    data: {},
    sourceInfo: SourceInfo.fromInstance(actor, item),
  };
  const config = new ActionConfig(action);
  await prepare(config, actor, item);
  await Events.performAction(config, actor, item);
  await invokeWithCallbacks(AH.hooks.PROCESS_ACTION, config, actor, item);
  await renderAction(config, actor, item);
  Events.resolveAction(new ActionInspector(config.check), actor, item);
}

/**
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
function onRenderChatMessage(message, html) {
  if (!message.getFlag(systemID, AH.flags.ChatMessage.DefenseCheck)) {
    return;
  }

  ChatMessageHelper.handleClick(message, html, "defenseCheck",
    /** @param {DefenseCheckSourceData} dataset  **/
    async (dataset) => {

      const fields = StringUtils.fromBase64(dataset.fields);
      const sourceInfo = SourceInfo.fromObject(fields.sourceInfo);
      const actor = fromUuidSync(dataset.uuid);
      if (!actor) {
        return;
      }

      await CheckPrompt.defenseCheck(actor, {
        initialConfig: {
          ...dataset,
          sourceInfo: sourceInfo,
        },
      });
    });

}

/**
 * Initializes the callback handlers for this pipeline.
 */
function initialize() {
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
}

const Actions = Object.freeze({
  initialize,
  perform,
  renderAction,

  addSections,
});

export default Actions;
