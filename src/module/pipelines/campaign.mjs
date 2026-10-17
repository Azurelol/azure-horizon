/**
 * @typedef EpisodeOpeningData
 */

import { ActionConfig, ChatAction, ChatMessageBuilder, ChatMessageHelper, Dialogs } from "../helpers/_module.mjs";
import { Formulas } from "../ruleset/_module.mjs";
import { StringUtils } from "../utils/_module.mjs";
import AH, { getFormSelectOptions } from "../config.mjs";
import { localize, notifyInfo, renderTemplate, systemID } from "../constants.mjs";
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
    {
      text: "AH.EXPERIENCE.TRIGGERS.CutawayScene",
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
 * @typedef AH_Approach
 * @property {String} label
 */

/**
 * @typedef AH_MontageItem
 * @property {String} label
 * @property {String} description
 */

/**
 * @typedef AH_Adversity
 * @property {String} label
 * @property {AH_MontageItem} complication
 * @property {Boolean} resolved
 */

/**
 * @typedef MontageData
 * @property {AH_DifficultyLevel} difficultyLevel
 * @property {AH_Adversity[]} adversities
 */

/**
 * @param {AH_DifficultyLevel} difficulty
 * @param {Number} heroCount
 * @returns {number}
 */
function getAdversityCount(difficulty, heroCount) {
  switch (difficulty) {
    case "easy":
      return Math.floor(heroCount / 2);
    case "normal":
      return heroCount;
    case "hard":
      return heroCount + 2;
    case "impossible":
      return heroCount + 4;
  }
}

/**
 * @property {PartyDataModel} party
 * @returns {Promise<void>}
 */
async function promptMontage(party) {

  const difficultyLevels = getFormSelectOptions(AH.difficultyLevel);
  const heroes = await party.getHeroes();
  const heroCount = heroes.length;
  const adversityChoices = getFormSelectOptions(AH.montage.adversities);
  const complicationChoices = getFormSelectOptions(AH.montage.complications);

  const defaultDifficulty = "normal";
  const initialCount = getAdversityCount(defaultDifficulty, heroCount);
  const adversities = Array.from({ length: initialCount }, () => ({
    label: "",
    complication: { label: "", description: "" },
  }));

  const content = await renderTemplate("dialogs/prompt-montage", {
    AH,
    partId: foundry.utils.randomID(),
    difficultyLevels,
    difficultyLevel: defaultDifficulty,
    heroCount,
    adversities,
    adversityChoices,
    complicationChoices,
  });

  // Take the blank row blueprint from the rendered HTML string itself, so "add"
  // doesn't depend on the <template> element surviving inside the dialog.
  const blueprint = document.createElement("template");
  blueprint.innerHTML = content;
  const rowTemplate = blueprint.content.querySelector("template[data-ah-row]");

  const result = await Dialogs.input({
    title: "AH.EPISODE.PromptMontage",
    position: {
      width: "auto",
      height: 600,
    },
    content,
    render: (event, dialog) => {
      const root = dialog.element;
      const list = root.querySelector("[data-ah-list]");

      // Re-index names/ids/for attributes and the visible number after any add/remove.
      const renumber = () => {
        [...list.children].forEach((row, i) => {
          row.dataset.index = i;
          row.querySelector("[data-ah-number]").textContent = i + 1;
          for (const el of row.querySelectorAll("[name], [id], [for]")) {
            for (const attr of ["name", "id", "for"]) {
              const value = el.getAttribute(attr);
              if (!value) continue;
              el.setAttribute(attr, value
                .replace(/adversities\.(\d+|__INDEX__)\./, `adversities.${i}.`)
                .replace(/-adv-(\d+|__INDEX__)-/, `-adv-${i}-`));
            }
          }
        });
        dialog.setPosition({ height: "auto" });
      };

      const addRow = () => {
        list.append(rowTemplate.content.cloneNode(true));
        renumber();
      };

      // Grow/shrink from the end so rows the user already filled in at the top are kept.
      const setCount = count => {
        while (list.children.length < count) list.append(rowTemplate.content.cloneNode(true));
        while (list.children.length > count) list.lastElementChild.remove();
        renumber();
      };

      // Overwrite a field with a new default only if the user hasn't customised it.
      const syncDefault = (field, newDefault) => {
        if (!field.value || field.value === field.dataset.default) field.value = newDefault;
        field.dataset.default = newDefault;
      };

      root.addEventListener("click", event => {
        const button = event.target.closest("[data-ah]");
        if (!button) return;
        if (button.dataset.ah === "add") addRow();
        else if (button.dataset.ah === "remove") {
          button.closest(".ah-adversity").remove();
          renumber();
        }
      });

      root.addEventListener("change", event => {
        const el = event.target;
        if (el.name === "difficultyLevel") {
          setCount(getAdversityCount(el.value, heroCount));
          return;
        }
        const row = el.closest(".ah-adversity");
        if (!row) return;

        if (el.dataset.ahField === "complication") {
          syncDefault(row.querySelector("[data-ah-field=\"description\"]"), complicationChoices[el.value]?.description ?? "");
        }
      });

      renumber();
    },
  });

  if (result) {
    const data = foundry.utils.expandObject(result);

    /** @type {MontageData} */
    const montage = {
      difficultyLevel: data.difficultyLevel,
      adversities: Object.values(data.adversities ?? {}).map(a => ({
        label: a.label?.trim() ?? "",
        complication: {
          label: a.complication?.label ?? "",
          description: a.complication?.description ?? "",
        },
        resolved: false,
      })).filter(a => a.label && a.complication.label),
    };

    notifyInfo(`Submitting montage with ${montage.adversities.length} adversities.`);

  }
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

  ChatMessageHelper.handleClick(message, html, "attributeCheck", async (dataset) => {
    const { primary, secondary, label, difficulty } = dataset;
    const targets = await ChatAction.getTargetsFromAction(dataset);
    for (const target of targets) {
      await Checks.attributeCheck(target, {
        primary: primary,
        secondary: secondary,
      }, null, async (check) => {
        let config = new ActionConfig(check);
        config.setLabel(label);
        config.setDifficulty(difficulty);
      });
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
  promptMontage,
});

export default Campaign;
