import Events from "./events.mjs";
import { ActionConfig, ActionInspector } from "../helpers/action-configuration.mjs";
import AH from "../config.mjs";
import { ChatAction, ChatMessageBuilder, ChatMessageSections, FlagBuilder } from "../helpers/_module.mjs";
import Flags from "../data/common/flags.mjs";
import { SourceInfo } from "../data/common/_module.mjs";
import { renderTemplate } from "../constants.mjs";
import { StringUtils } from "../utils/_module.mjs";

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
 * Adds common chat sections
 * @param {ChatMessageBuilderData} builderData
 * @param {ActionConfig} config
 */
async function addSections(builderData, config, actor, item) {

  // TARGET SECTIONS
  const isTargeted = config.getTargets() > 0;
  if (isTargeted) {
    config.addAction(ChatAction.TARGET_ACTION);
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
  if (item) {
    let linked = [];
    const weaponReference = config.getWeaponReference();
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
      title: flavorTitle,
      item: referencedItem,
      label: config.getLabel(),
    });
  }
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

const Actions = Object.freeze({
  perform,
  renderAction,

  addSections,
});

export default Actions;
