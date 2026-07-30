import { FoundryUtils, StringUtils } from "../utils/_module.mjs";
import AH from "../config.mjs";
import { renderTemplate, systemNS } from "../constants.mjs";
import Handlebars from "./handlebars.mjs";
import Checks from "../pipelines/checks.mjs";
import { ActionConfig } from "./action-configuration.mjs";

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
 * @typedef CheckPromptOptions
 * @template T
 * @property {T} [initialConfig] The configuration for the specific check.
 * @property {CheckPrepareCallback} checkCallback
 * @property {CheckResultCallback} resultCallback
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
    increment: initialConfig.increment !== undefined,
    attributes: AH.attributes,
    attributeValues: attributeValues,
    attributeOptions: FoundryUtils.generateConfigIconOptions(Object.keys(AH.attributes), AH.attributes, AH.icons),
    primary: recentCheck.primary,
    secondary: recentCheck.secondary,
    modifier: recentCheck.modifier,
    difficulty: recentCheck.difficulty,
    supportDifficulty: recentCheck.supportDifficulty,
    bonus: actor.system?.bonuses?.accuracy?.all ?? 0,
  };

  switch (type) {
    case "open": {
      context.bonus += 0;
      break;
    }
  }

  const title = initialConfig.title ?? AH.checkTypes[type];
  const result = await foundry.applications.api.DialogV2.input({
    window: {
      title: game.i18n.localize(title),
      icon: "fa-solid fa-dice",
    },
    classes: ["ah-application", "ah-dialog"],
    actions: {
      setDifficulty: onSetDifficulty,
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
 * Shared logic for prompt-driven checks: runs the prompt, then invokes the
 * matching `Checks.*Check` method with a callback that applies prompt-derived
 * config before delegating to the caller's own checkCallback.
 *
 * @template T
 * @param {AHActor} actor
 * @param {"open"|"attribute"} type
 * @param {CheckPromptOptions<T>} options
 * @param {(config: ActionConfig, promptResult: object) => void} applyPromptConfig
 *        Applies values from the prompt result onto the CheckConfigurer.
 * @param {...any} extraArgs
 *        Extra positional args required by the specific Checks.*Check method,
 *        inserted between the primary/secondary payload and the callback.
 * @returns {Promise<void>}
 */
async function runCheckPrompt(actor, type, options, applyPromptConfig, ...extraArgs) {
  const promptResult = await prompt(actor, type, options.initialConfig);
  if (promptResult) {
    return Checks[`${type}Check`](
      actor,
      {
        primary: promptResult.primary,
        secondary: promptResult.secondary,
      },
      ...extraArgs,
      (check, callbackActor, item) => {
        const config = new ActionConfig(check);
        applyPromptConfig(config, promptResult);

        if (options.checkCallback) {
          options.checkCallback(check, callbackActor, item);
        }
      },
    );
  }
}

/**
 * @param {AHActor} actor
 * @param {CheckPromptOptions<OpenCheckConfig>} [options]
 * @returns {Promise<void>}
 */
async function openCheck(actor, options = {}) {
  return runCheckPrompt(actor, "open", options, (config, promptResult) => {
    if (promptResult.modifier) {
      config.addModifier("AH.CHECK.SituationalModifier", promptResult.modifier);
    }
  });
}

/**
 * @param {AHActor} actor
 * @param {CheckPromptOptions<AttributeCheckConfig>} [options]
 * @returns {Promise<void>}
 */
async function attributeCheck(actor, options = {}) {
  return runCheckPrompt(actor, "attribute", options, (config, promptResult) => {
    if (promptResult.difficulty) {
      config.setDifficulty(promptResult.difficulty);
    }
    if (promptResult.modifier) {
      config.addModifier("AH.CHECK.SituationalModifier", promptResult.modifier);
    }
  }, null);
}

export const CheckPrompt = Object.freeze({
  attributeCheck,
  openCheck,
});
