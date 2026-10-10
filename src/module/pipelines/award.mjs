/**
 * @typedef TreasureChoice
 * @property {AH_EquipmentType} type
 * @property {AH_Rarity} rarity
 * @property {Number} index
 * @property {AH_ItemReference} item
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
import { localize, notifyInfo, notifyWarn, renderTemplate, systemAssetPath, systemID } from "../constants.mjs";
import AH from "../config.mjs";
import { FoundryUtils, ObjectUtils, StringUtils } from "../utils/_module.mjs";
import { SourceInfo } from "../data/common/_module.mjs";
import DamageData from "./damage-data.mjs";
import { DamageRequest } from "./_module.mjs";
import { CompendiumIndex } from "../data/compendium/_module.mjs";
import { Overlay } from "../fx/_module.mjs";

const CHOICE_COUNT = 3;
const AWARD_ACTION = "rollTreasure";

/**
 * Opens a prompt to reward the party with treasure.
 * @param {TreasurePromptOptions} options
 * @returns {Promise<void>}
 */
async function promptTreasure(options) {

  /** @type {TreasureChoice[]} **/
  let pools = [];
  for (let p = 0; p < CHOICE_COUNT; p++) {
    pools.push({
      type: "weapon",
      rarity: "common",
    });
  }

  const rarityOptions = AH.rarity;
  const equipmentOptions = AH.character.equipment;

  const input = await Dialogs.input({
    title: localize("AH.DIALOG.AwardEquipment"),
    content: await renderTemplate("dialogs/award-equipment", {
      pools,
      equipmentOptions,
      rarityOptions,
    }, true),
  });

  if (input) {
    const expanded = ObjectUtils.expandObject(input);
    // DO STUFF
    console.debug(`Preparing to post ${expanded} to chat`);

    let builder = new ChatMessageBuilder();
    builder.text(localize("AH.DIALOG.AwardEquipmentMessage"));
    const flags = new FlagBuilder().toggle(AH.flags.ChatMessage.Award).toObject();
    builder.withFlags(flags);
    builder.template("chat/chat-section-treasure", {
      treasure: expanded.equipment,
    });
    await builder.create();
  }
}

/**
 * @param {ChatMessage} message
 * @param {TreasureChoice} choice
 */
async function rollTreasure(message, choice) {
  const entries = await CompendiumIndex.instance.getEquipmenEntries();
  const items = entries[choice.type];
  if (!items) {
    notifyWarn(`Failed to resolve items of type ${choice.type}`);
    return;
  }
  const pool = items.filter(it => it.system.rarity === "rarity");
  if (!pool || !pool.length) {
    notifyWarn(`Failed to resolve '${choice.type}' items of rarity ${choice.rarity}`);
    return;
  }

  const roll = await new Roll(`1d${pool.length}`).evaluate();
  notifyInfo(`Rolled treasure ${roll.total} in chat message ${message.id} of ${JSON.stringify(choice)}`);

  await Overlay.video({
    src: systemAssetPath("ui/video/chest_open.webm"),
  });

  // TODO: Play SFX

}

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
      const { index, type, rarity } = element.dataset;
      const _message = ChatMessageHelper.fromId(messageId);
      rollTreasure(_message, {
        index: Number(index),
        type,
        rarity,
      });

      // TODO: Roll the item from teh tables then update the chat message

    });
  });
}

/**
 * Initializes the callback handlers for this pipeline.
 */
function initialize() {
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
}

const Award = Object.freeze({
  initialize,
  promptTreasure,
});

export default Award;
