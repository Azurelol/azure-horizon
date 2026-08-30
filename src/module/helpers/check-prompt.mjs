import { FoundryUtils, StringUtils } from "../utils/_module.mjs";
import AH from "../config.mjs";
import { renderTemplate, systemNS } from "../constants.mjs";
import Handlebars from "./handlebars.mjs";
import Checks from "../pipelines/checks.mjs";
import { ActionConfig } from "./action-configuration.mjs";
import { Formulas } from "../ruleset/_module.mjs";
import Dialogs from "./dialogs.mjs";

/**
 * @typedef CheckConfig
 * @property {String} title
 * @property {AH_Attribute} primary
 * @property {AH_Attribute} secondary
 * @property {number} modifier
 */

/**
 * @typedef {CheckConfig} OpenCheckConfig
 */

/**
 * @typedef {CheckConfig} AttributeCheckConfig
 * @property {number|undefined} difficulty If set, will be checked against.
 */

/**
 * @typedef {CheckConfig} GroupCheckConfig
 * @property {number|undefined} difficulty If set, will be checked against.
 */

/**
 * @typedef {CheckConfig} DefenseCheckConfig
 * @property {AH_Defense} defense The defense being checked for.
 * @property {number|undefined} difficulty If set, will be checked against.
 * @property {String} id The id of the action that led to the check.
 * @property actor The uuid of the attacker.
 * @property item The uuid of the item used in the attack.
 */

/**
 * @typedef CheckPromptOptions
 * @template T
 * @property {T} [initialConfig] The configuration for the specific check.
 * @property {CheckPrepareCallback} onPrepare
 * @property {CheckResultCallback} onResult
 * @property
 */

/**
 * @param {PointerEvent} event   The originating click event
 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
 * @returns {Promise<void>}
 */
async function onSetDifficulty(event, target) {
  const input = target.closest("fieldset").querySelector("input[name='difficulty']");
  if (!input) return;
  input.value = target.dataset.value ?? "";
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

/**
 * @param {PointerEvent} event   The originating click event
 * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
 * @returns {Promise<void>}
 */
async function onUpdateRitual(event, target) {
  const form = target.closest("form"); // ?? this.element;

  // Selected radios
  const potencyInput = form.querySelector("input[name=\"potency\"]:checked");
  const potencyKey = potencyInput?.value ?? null;
  const areaKey = form.querySelector("input[name=\"area\"]:checked")?.value ?? null;

  const potency = AH.potency[potencyKey];
  const area = AH.area[areaKey];
  const cost = potency.cost * area.multiplier;

  // Update hidden difficulty input
  const diffInput = form.querySelector("input[name=\"difficulty\"]");
  if (diffInput) diffInput.value = potency.difficulty;

  const costInput = form.querySelector("input[name=\"cost\"]");
  if (costInput) costInput.value = cost;

  const costEl = form.querySelector("#ritual-cost");
  if (costEl) {
    costEl.textContent = cost.toString();
  }
}

/**
 * @typedef RecentChecks
 * @property {AttributeCheckConfig} attribute
 * @property {OpenCheckConfig} open
 */

const RECENT_CHECKS_KEY = `${systemNS}.recentChecks`;

/**
 * @param {'attribute', 'open', 'group'} type
 * @returns {RecentChecks['attribute'] | RecentChecks['open'] |RecentChecks['group']}
 */
function initDefaults(type) {
  /** @type AttributeCheckConfig */
  const defaults = {
    primary: "dex",
    secondary: "dex",
    difficulty: 10,
    modifier: 0,
  };
  if (type === "open") {
    delete defaults.difficulty;
  }
  return defaults;
}

/**
 * @param {Actor} actor
 * @param {'attribute', 'open', 'group'} type
 * @returns {RecentChecks['attribute'] | RecentChecks['open'] |RecentChecks['group']}
 */
function loadRecentCheck(actor, type) {
  /** @type {Record<string, RecentChecks>} */
  const recentChecks = JSON.parse(sessionStorage.getItem(RECENT_CHECKS_KEY) || "{}");
  const actorChecks = recentChecks[actor.uuid] ?? {};
  return foundry.utils.mergeObject(initDefaults(type), actorChecks[type]);
}

/**
 * @param {AHActor} actor
 * @param {"attribute", "open", "group"}type
 * @param {AttributeCheckConfig, OpenCheckConfig} config
 */
function saveRecentCheck(actor, type, config) {
  /** @type {Record<string, RecentChecks>} */
  const recentChecks = JSON.parse(sessionStorage.getItem(RECENT_CHECKS_KEY) || "{}");
  const actorChecks = (recentChecks[actor.uuid] ??= {});

  actorChecks[type] = { ...initDefaults(type), ...config };

  sessionStorage.setItem(RECENT_CHECKS_KEY, JSON.stringify(recentChecks));
}

/**
 * @template T
 * @param {AHActor} actor
 * @param {CheckType} type
 * @param {T} initialConfig
 * @returns {Promise<AttributeCheckConfig>}
 */
async function prompt(actor, type, initialConfig = {}) {
  const recentCheck = loadRecentCheck(actor, type);

  Object.keys(recentCheck).forEach((key) => {
    if (initialConfig[key] != null) {
      recentCheck[key] = initialConfig[key];
    }
  });

  const attributeValues = Object.entries(actor.system.attributes).reduce(
    (previousValue, [attribute, { current }]) => ({
      ...previousValue,
      [attribute]: current,
    }),
    {},
  );

  let context = {
    actor: actor,
    type: type,
    typeLabel: StringUtils.localize(AH.checkTypes[type]),
    label: initialConfig.label,
    increment: initialConfig.additive !== undefined,
    attributes: AH.attributes,
    attributeValues: attributeValues,
    attributeOptions: FoundryUtils.generateConfigIconOptions(Object.keys(AH.attributes), AH.attributes, AH.icons),
    primary: recentCheck.primary,
    secondary: recentCheck.secondary,
    modifier: recentCheck.modifier,
    difficulty: recentCheck.difficulty,
    supportDifficulty: recentCheck.supportDifficulty,
    bonus: actor.system?.parameters?.checks?.all ?? 0,
  };

  switch (type) {
    case "open": {
      context.bonus += 0;
      break;
    }
    case "ritual": {
      const potency = AH.potency.minor;
      const area = AH.area.entity;
      context = Object.assign(context, {
        potency: potency,
        area: area,
        cost: potency.cost * area.multiplier,
        difficulty: potency.difficulty,
        potencyOptions: AH.potency,
        areaOptions: AH.area,
      });
      break;
    }
  }

  const title = initialConfig.title ?? AH.checkTypes[type];
  const result = await Dialogs.input({
    window: {
      title: StringUtils.localize(title),
      icon: "fa-solid fa-dice",
      scrollable: true,
    },
    position: {
      width: 500,
      height: "auto",
    },
    classes: ["ah-application", "ah-dialog"],
    actions: {
      setDifficulty: onSetDifficulty,
      updateRitual: onUpdateRitual,
    },
    content: await renderTemplate("dialogs/dialog-check-prompt", context),
    rejectClose: false,
    ok: {
      icon: AH.icons.roll,
      label: StringUtils.localize("AH.COMMON.Submit"),
    },
    /** @param {Event} event
     *  @param {HTMLElement} dialog **/
    render: (event, dialog) => {
      Handlebars.setupComponent.iconRadioGroups(dialog.element, context);
    },
  });
  if (result) {
    saveRecentCheck(actor, type, result);
    return result;
  }
  return null;
}

/**
 * @param {AHActor} actor
 * @param {CheckPromptOptions<OpenCheckConfig>} [options]
 * @returns {Promise<void>}
 */
async function openCheck(actor, options = {}) {
  const promptResult = await prompt(actor, "open", options.initialConfig);
  if (!promptResult) return;

  return Checks.openCheck(
    actor,
    {
      primary: promptResult.primary,
      secondary: promptResult.secondary,
    },
    (check, callbackActor, item) => {
      const config = new ActionConfig(check);
      if (promptResult.modifier) {
        config.addModifier("AH.CHECK.SituationalModifier", promptResult.modifier);
      }

      if (options.onPrepare) {
        options.onPrepare(check, callbackActor, item);
      }
    },
  );
}

/**
 * @param {AHActor} actor
 * @param {CheckPromptOptions<AttributeCheckConfig>} [options]
 * @returns {Promise<void>}
 */
async function attributeCheck(actor, options = {}) {
  const promptResult = await prompt(actor, "attribute", options.initialConfig);
  if (!promptResult) return;

  return Checks.attributeCheck(
    actor,
    {
      primary: promptResult.primary,
      secondary: promptResult.secondary,
    },
    null,
    (check, callbackActor, item) => {
      const config = new ActionConfig(check);
      if (promptResult.difficulty) {
        config.setDifficulty(promptResult.difficulty);
      }
      if (promptResult.modifier) {
        config.addModifier("AH.CHECK.SituationalModifier", promptResult.modifier);
      }
      if (options.onPrepare) {
        options.onPrepare(check, callbackActor, item);
      }
    },
  );
}

/**
 * @param {AHActor} actor
 * @param {AHItem} item
 * @param {CheckPromptOptions<GroupCheckConfig>} [options]
 * @returns {Promise<void>}
 */
async function ritualCheck(actor, item, options = {}) {
  const promptResult = await prompt(actor, "ritual", options);
  if (promptResult) {
    return Checks.ritualCheck(
      actor,
      {
        primary: promptResult.primary,
        secondary: promptResult.secondary,
      },
      item,
      (check, callbackActor, item) => {

        const config = new ActionConfig(check);
        config.setAttributes(promptResult.primary, promptResult.secondary);
        if (promptResult.difficulty) {
          config.setDifficulty(promptResult.difficulty);
        }
        // TODO: Fix on prompt invoke
        // Use default difficulty if it wasn't changed
        else {
          config.setDifficulty(AH.potency.minor.difficulty);
        }

        if (promptResult.modifier) {
          config.addModifier("AH.CHECK.SituationalModifier", promptResult.modifier);
        }
        if (item) {
          config.setItemReference(item);
        }
        config.addExpense({
          resource: "mp",
          amount: promptResult.cost,
        });
        // TODO: Add bonuses to ally based on traits

        if (options.checkCallback) {
          options.checkCallback(check, callbackActor, item);
        }
      },
    );
  }
}

/**
 * @param {AHActor} actor
 * @param {CheckPromptOptions<DefenseCheckConfig>} [options]
 * @returns {Promise<void>}
 */
async function defenseCheck(actor, options = {}) {
  const defenseConfig = actor.system.getDefense(options.initialConfig.defense);
  if (!defenseConfig) {
    throw Error("Only hero characters can roll defense checks.");
  }
  options.initialConfig.primary = defenseConfig.primary;
  options.initialConfig.secondary = defenseConfig.secondary;

  const promptResult = await prompt(actor, "defense", options.initialConfig);
  if (!promptResult) return;

  return Checks.defenseCheck(
    actor,
    defenseConfig,
    (check, callbackActor, item) => {
      const config = new ActionConfig(check);
      config.setDifficulty(options.initialConfig.difficulty);
      if (promptResult.modifier) {
        config.addModifier("AH.CHECK.SituationalModifier", promptResult.modifier);
      }
      if (options.onPrepare) {
        options.onPrepare(check, callbackActor, item);
      }
    },
    (result, callbackActor, item) => {
      // Update other chat message?
      const potency = Formulas.calculatePotency(result, options.initialConfig.difficulty, true);
      const defender = actor;
      const attacker = fromUuidSync(options.initialConfig.actor);
      const attackItem = attacker.items.get(options.initialConfig.item);
      let winner;
      switch (potency) {
        case "reduced":
          winner = defender.name;
          break;
        case "standard":
        case "powerful":
          winner = attacker.name;
          break;
      }

      const config = new ActionConfig(result);
      config.updateDefenseResult({
        result: result,
        difficulty: options.initialConfig.difficulty,
        potency,
        defense: options.initialConfig.defense,
        defender: actor,
        attacker: attacker,
        item: attackItem,
        winner,
        traits: [],
      });
      ui.notifications.info(`Now updating potency result on message '${options.initialConfig.id}' for ${actor.uuid} to: ${potency}`);

    },
  );
}

export const CheckPrompt = Object.freeze({
  attributeCheck,
  openCheck,
  defenseCheck,
  ritualCheck,
});
