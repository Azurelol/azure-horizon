/**
 * @typedef EpisodeOpeningData
 */

import { ChatAction, ChatMessageBuilder, ChatMessageHelper } from "../helpers/_module.mjs";
import { Formulas } from "../ruleset/_module.mjs";
import { StringUtils } from "../utils/_module.mjs";
import AH from "../config.mjs";
import { systemID } from "../constants.mjs";
import { SourceInfo } from "../data/common/_module.mjs";
import DamageData from "./damage-data.mjs";
import { DamageRequest } from "./_module.mjs";
import Checks from "./checks.mjs";

/**
 * @param {PartyDataModel} party
 * @returns {Promise<EpisodeOpeningData>}
 */
async function prepareOpeningData(party) {

}

/**
 * @typedef ExperienceTrigger
 * @property {String} text
 * @property {Number} amount
 */

/**
 * @typedef ExperienceTriggerGroup
 * @property {PartyHeroData[]} heroes The heroes that can make use of this trigger.
 * @property {String} label
 * @property {ExperienceTrigger[]} triggers
 */

/**
 * @type {ExperienceTriggerGroup}
 */
const BASE_TRIGGERS = {
  label: "AH.EXPERIENCE.GROUP.Campaign",
  triggers: [
    {
      text: "AH.EXPERIENCE.TRIGGERS.Scheduling",
      amount: 10,
    },
    {
      text: "AH.EXPERIENCE.TRIGGERS.Location",
      amount: 1,
    },
    {
      text: "AH.EXPERIENCE.TRIGGERS.Adversary",
      amount: 1,
    },
    {
      text: "AH.EXPERIENCE.TRIGGERS.Recollection",
      amount: 1,
    },
    {
      text: "AH.EXPERIENCE.TRIGGERS.CharacterMeet",
      amount: 1,
    },
    {
      text: "AH.EXPERIENCE.TRIGGERS.AssetHelp",
      amount: 1,
    },
    {
      text: "AH.EXPERIENCE.TRIGGERS.Obstacle",
      amount: 1,
    },
  ],
};

/**
 * @typedef EpisodeEndingData
 * @property {Record<string, ExperienceTriggerGroup>} groups
 */

/**
 * @param {PartyDataModel} party
 * @returns {Promise<EpisodeEndingData>}
 */
async function prepareEndingData(party) {
  const heroes = await party.getHeroes();
  /** @type EpisodeEndingData **/
  let data = {};
  // Add the base set of triggers
  data.groups = {
    base: BASE_TRIGGERS,
  };
  // For each hero class
  for (const hero of heroes) {
    for (const classItem of hero.actor.getItemsByType("class")) {
      /** @type ClassDataModel **/
      const classData = classItem.system;
      const key = classData.slug;
      if (!data.groups[key]) {
        data.groups[key] = {
          label: key,
          heroes: [hero],
          triggers: Array.from(classData.triggers).map((t) => {
            return { text: t, amount: 1 };
          }),
        };
      }
      else {
        data.groups[key].heroes.push(hero);
      }
    }

  }
  return data;
}

/**
 * @param {Number} value
 * @returns {Promise<void>}
 */
async function processTravelCheck(value) {
  const travel = Formulas.resolveTravelCheck(value);
  let message;
  switch (travel) {
    case "danger":
      message = "AH.TRAVEL.DangerMessage";
      break;
    case "discovery":
      message = "AH.TRAVEL.DiscoveryMessage";
      break;
    case "none":
      message = "AH.TRAVEL.NoneMessage";
      break;
  }

  const builder = new ChatMessageBuilder(null, null);
  builder.text(`${StringUtils.localize("AH.TRAVEL.RollMessage", { result: value })} ${StringUtils.localize(message)}`);
  return builder.create();
}

/**
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 */
function onRenderChatMessage(message, html) {
  if (!message.getFlag(systemID, AH.flags.ChatMessage.Campaign)) {
    return;
  }

  ChatMessageHelper.handleClick(message, html, "travelCheck", async (dataset) => {
    const formula = AH.journey.dangers[dataset.level].formula;
    const result = await Checks.travelCheck(formula);
    if (result) {
      return processTravelCheck(result);
    }
  });
}

/**
 * Initialize callbacks.
 */
function initialize() {
  Hooks.on("renderChatMessageHTML", onRenderChatMessage);
}

const Campaign = Object.freeze({
  initialize,
  prepareOpeningData,
  prepareEndingData,
  processTravelCheck,
});

export default Campaign;
