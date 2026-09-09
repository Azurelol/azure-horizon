import { AsyncHooks, ChatAction, ChatMessageBuilder, ChatMessageHelper } from "../helpers/_module.mjs";
import AH from "../config.mjs";
import { notifyInfo, systemID } from "../constants.mjs";
import { StringUtils } from "../utils/_module.mjs";
import Effects from "./effects.mjs";
import Resources, { ResourceRequest } from "./resources.mjs";
import ResourceData from "./resource-data.mjs";

/**
 * @param {UpdateResourceEvent} event
 * @returns {Promise<void>}
 */
async function onUpdateResource(event) {
  if (event.resource === "tp") {
    /** @type ActorResourceDataModel **/
    const tp = event.subject.actor.system.resources.tp;
    if (tp.full) {
      notifyInfo(`${event.subject.actor.name} has reached its limit!`);
      const builder = new ChatMessageBuilder(event.subject.actor, null);
      builder.text(StringUtils.localize("AH.CHAT.GainStressMessage", {
        name: event.subject.actor.name,
      }));
      const stressAction = await Effects.getChatAction("stress", event.sourceInfo);
      const mpLossRequest = new ResourceRequest(event.sourceInfo, [event.subject],
        ResourceData.initialize("mp", "-&mp(0.2)", false));
      const mpLossAction = await Resources.getChatAction(mpLossRequest);
      const tpResetAction = new ChatAction("clearTension", AH.icons.tp)
        .withDataset({
          uuid: event.subject.actor.uuid,
        })
        .setFlag(AH.flags.ChatMessage.Resource)
        .requiresOwner()
        .withLabel(StringUtils.localize("AH.CHAT.ClearTension"))
        .withSelected();
      builder.action(stressAction);
      builder.action(mpLossAction);
      builder.action(tpResetAction);
      await builder.create();
    }
  }
}

/**
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
function onRenderChatMessage(message, html) {
  if (!message.getFlag(systemID, AH.flags.ChatMessage.Resource)) {
    return;
  }

  ChatMessageHelper.handleClick(message, html, "clearTension", async (dataset) => {
    const uuid = dataset.uuid;
    const actor = fromUuidSync(uuid);
    const updates = [];
    const resource = "tp";
    updates.push(actor.modifyTokenAttribute(`resources.${resource}`, 0, false));
    return Promise.all(updates);
  });
}

/**
 * Initialize callbacks.
 */
function initialize() {
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
  AsyncHooks.on(AH.hooks.UPDATE_RESOURCE_EVENT, onUpdateResource);
}

const Tension = Object.freeze({
  initialize,
});

export default Tension;
