/**
 * @typedef AH_TreasureChoice
 * @property {AH_EquipmentType} type
 * @property {AH_Rarity} rarity
 * @property {Number} index
 * @property {String} key
 * @property {AH_ItemReference} item
 */

/**
 * @typedef AH_TreasureChoiceGroup
 * @property {AH_TreasureChoice} first
 * @property {AH_TreasureChoice} second
 * @property {AH_TreasureChoice} third
 */

/**
 * @typedef TreasurePromptOptions
 * @property {PartyDataModel} partyData
 */

import {
  ChatAction,
  ChatMessageBuilder,
  ChatMessageHelper,
  ChatMessageSectionTemplate,
  Dialogs, FlagBuilder,
} from "../helpers/_module.mjs";
import {
  localize,
  notifyInfo,
  notifyWarn,
  receiveSocketEvent,
  renderTemplate, sendSocketEvent,
  systemAssetPath,
  systemID,
} from "../constants.mjs";
import AH from "../config.mjs";
import { FoundryUtils, ObjectUtils, StringUtils } from "../utils/_module.mjs";
import { ItemInfo, SourceInfo } from "../data/common/_module.mjs";
import DamageData from "./damage-data.mjs";
import { DamageRequest } from "./_module.mjs";
import { CompendiumIndex } from "../data/compendium/_module.mjs";
import { Overlay } from "../fx/_module.mjs";

const CHOICE_COUNT = 3;
const AWARD_ACTION = "rollTreasure";
const CHAT_TEMPLATE = "chat/chat-section-treasure";

/**
 * Opens a prompt to reward the party with treasure.
 * @param {TreasurePromptOptions} options
 * @returns {Promise<void>}
 */
async function promptTreasure(options) {

  /** @type {AH_TreasureChoice[]} **/
  let choices = [];
  choices.push({
    type: "weapon",
    rarity: "common",
  });
  choices.push({
    type: "armor",
    rarity: "common",
  });
  choices.push({
    type: "accessory",
    rarity: "common",
  });

  const rarityOptions = AH.rarity;
  const equipmentOptions = AH.character.equipment;

  const input = await Dialogs.input({
    title: localize("AH.DIALOG.AwardEquipment"),
    content: await renderTemplate("dialogs/award-equipment", {
      choices,
      equipmentOptions,
      rarityOptions,
    }, true),
  });

  if (input) {
    const expanded = ObjectUtils.expandObject(input);
    // DO STUFF
    console.debug(`Preparing to post ${expanded} to chat`);

    let builder = new ChatMessageBuilder();
    const flags = new FlagBuilder().toggle(AH.flags.ChatMessage.Award);
    /** @type AH_TreasureChoiceGroup  **/
    const data = {
      first: expanded.equipment[0],
      second: expanded.equipment[1],
      third: expanded.equipment[2],
    };
    flags.set(AH.flags.ChatMessage.Treasure, data);
    builder.withFlags(flags.toObject());
    builder.template(CHAT_TEMPLATE, {
      data,
    });

    await builder.create();
  }
}

/**
 * @param {ChatMessage} message
 * @param {String} key
 */
async function rollTreasure(message, key) {

  // Check whether there's a current item already rolled.
  /** @type AH_TreasureChoiceGroup **/
  let data = message.getFlag(systemID, AH.flags.ChatMessage.Treasure);
  if (!data) {
    return;
  }

  /** @type AH_TreasureChoice **/
  let current = data[key];
  if (current.item) {
    notifyWarn("That item choice has already been rolled.");
    return;
  }

  const entries = await CompendiumIndex.instance.getEquipmenEntries();
  const items = entries[current.type];
  if (!items) {
    notifyWarn(`Failed to resolve items of type ${current.type}`);
    return;
  }
  const pool = items.filter(it => it.system.rarity === current.rarity);
  if (!pool || !pool.length) {
    notifyWarn(`Failed to resolve '${current.type}' items of rarity ${current.rarity}`);
    return;
  }

  const roll = await new Roll(`1d${pool.length}`).evaluate();
  const index = roll.total;
  const item = pool[index - 1];
  //notifyInfo(`Rolled ${item.name} (${index}/${pool.length}) in chat message ${message.id} of ${JSON.stringify(choice)}`);

  // TODO: Play SFX
  await Overlay.broadcastVideo({
    src: systemAssetPath("ui/video/chest_open.webm"),
  });

  // Set the current item and update the chat message
  current.item = ItemInfo.toItemReference(item);
  const content = await renderTemplate(CHAT_TEMPLATE, { data,
  });

  await message.update({
    content,
    [`flags.${systemID}.${AH.flags.ChatMessage.Treasure}`]: data,
  });
}

/**
 * @typedef AH_RollTreasureData
 * @property {String} messageId
 * @property {String} key
 */

/**
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
function onRenderChatMessage(message, html) {
  if (!message.getFlag(systemID, AH.flags.ChatMessage.Award)) {
    return;
  }

  const messageId = message.id;

  html.querySelectorAll(`a[data-action="${AWARD_ACTION}"]`).forEach((element) => {
    element.addEventListener("click", async (event) => {
      event.preventDefault();
      const { type, key, rarity } = element.dataset;
      const data = {
        messageId,
        key,
      };
      if (game.user.isGM) {
        onRollTreasure(data);
      }
      else {
        sendSocketEvent(AH.sockets.ROLL_TREASURE, data);
      }
    });
  });
}

/**
 * @param {AH_RollTreasureData} data
 */
function onRollTreasure(data) {
  const _message = ChatMessageHelper.fromId(data.messageId);
  rollTreasure(_message, data.key);
}

/**
 * Initializes the callback handlers for this pipeline.
 */
function initialize() {
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
  receiveSocketEvent(AH.sockets.ROLL_TREASURE, onRollTreasure);
}

const Award = Object.freeze({
  initialize,
  promptTreasure,
});

export default Award;
