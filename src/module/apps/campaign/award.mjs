/**
 * @typedef TreasurePool
 * @property {AH_EquipmentType} type
 * @property {AH_Rarity} rarity
 */

/**
 * @typedef TreasurePromptOptions
 * @property {PartyDataModel} partyData
 */

import { Dialogs } from "../../helpers/_module.mjs";
import { localize, renderTemplate } from "../../constants.mjs";
import AH from "../../config.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";

const CHOICE_COUNT = 3;

/**
 * Opens a prompt to reward the party with treasure.
 * @param {TreasurePromptOptions} options
 * @returns {Promise<void>}
 */
async function promptTreasure(options) {

  /** @type {TreasurePool[]} **/
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
    content: await renderTemplate("dialogs/award-treasure", {
      pools,
      equipmentOptions,
      rarityOptions,
    }),
  });

  if (input) {
    let data = FoundryUtils.expandObject(input);
    // DO STUFF
    console.debug("Preparing to post to chat");
  }

}

export const Award = Object.freeze({
  promptTreasure,
});
