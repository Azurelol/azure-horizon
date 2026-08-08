import {
  ActionConfig, ActionInspector,
  ChatAction,
  ChatMessageBuilder,
  ChatMessageSections,
  ChatSectionOrder,
  FlagBuilder,
} from "../helpers/_module.mjs";
import { Formulas } from "../ruleset/_module.mjs";
import { renderTemplate, systemTemplatePath } from "../constants.mjs";
import { StringUtils } from "../utils/_module.mjs";
import AH from "../config.mjs";
import { SourceInfo } from "../data/common/_module.mjs";
import Flags from "../data/common/flags.mjs";
import Events from "./events.mjs";
import Actions from "./actions.mjs";

const { DiceTerm, NumericTerm } = foundry.dice.terms;

/**
 * @typedef {string} CheckId
 */

/**
 * @typedef CheckAttributes
 * @property {AH_Attribute} primary
 * @property {AH_Attribute} secondary
 */

/**
 * @typedef CheckModifier
 * @property {string} label the label or localization key for this modifier
 * @property {number} value the value of this modifier
 */

/**
 * @typedef AttributeDieRoll
 * @property {AH_Attribute} attribute
 * @property {number} dice
 * @property {Number} result
 */

/**
 * @typedef {Action} Check
 * @property {CheckType} type The type of the check.
 * @property {CheckId} id A unique identifier for this check.
 * @property {CheckModifier[]} modifiers array of modifiers
 * @property {Boolean} generateOpportunity Whether this check can generate an opportunity.
 * @property {number} critThreshold The critical threshold for this check.
 */

/**
 * @typedef {Check} CheckOptions the basic configuration of the check. This object is sealed
 * @property {AH_Attribute} primary the first attribute
 * @property {AH_Attribute} secondary the second attribute
 */

/**
 * @typedef {Check} CheckResult
 * @property {string} actorUuid
 * @property {string} itemUuid
 * @property {string} itemName
 * @property {SourceInfo} sourceInfo
 * @property {Roll | Object} roll the Roll instance or serialized form of the primary check
 * @property {(Roll | Object)[]} additionalRolls any secondary rolls, either as Roll instances or serialized
 * @property {AttributeDieRoll} primary
 * @property {AttributeDieRoll} secondary
 * @property {AttributeDieRoll} hr
 * @property {number} modifierTotal the sum of all modifier
 * @property {number} total the total result of the check
 * @property {boolean} fumble
 * @property {boolean} critical
 */

/**
 * @callback CheckPrepareCallback
 * @param {CheckOptions} check
 * @param {AHActor} actor
 * @param {AHItem} item
 * @return {Promise | void}
 */

/**
 * @callback CheckResultCallback
 * @param {CheckResult} result
 * @param {AHActor} actor
 * @param {AHItem} item
 * @return {Promise | void}
 */

/**
 * @callback CheckRenderCallback
 * @param {ChatMessageBuilderData} data
 * @param {CheckResult} result
 * @param {AHActor} actor
 * @param {AHItem} item
 * @return {Promise | void}
 */

/**
 * @param {String} hook The name of the hook
 * @param {Partial<CheckOptions|CheckResult>} check
 * @param {AHActor} actor
 * @param {AHItem} item
 * @returns {Promise<void>}
 */
async function invokeWithCallbacks(hook, check, actor, item) {
  /**
   * @type {{callback: Promise | (() => Promise | void), priority: number}[]}
   */
  const callbacks = [];
  const registerCallbacks = (callback, priority = 0) => {
    callbacks.push({ callback, priority });
  };

  Hooks.callAll(hook, check, actor, item, registerCallbacks);

  callbacks.sort((a, b) => a.priority - b.priority);
  for (let callbackObj of callbacks) {
    await callbackObj.callback(check, actor, item);
  }
}

/**
 * @param {Partial<CheckOptions>} check
 * @return {Partial<CheckOptions>}
 */
function initializeCheckDefaults(check) {
  check.primary ??= "";
  check.secondary ??= "";
  check.id ??= foundry.utils.randomID();
  check.modifiers ??= [];
  check.data ??= {};
  check.critThreshold = Formulas.CRITICAL_THRESHOLD;
  check.generateOpportunity = true;
  Object.seal(check);
  return check;
}

/**
 * @param {Partial<CheckOptions>} check
 */
function validateCheckAttributes(check) {
  if (!check.primary || !check.secondary) {
    throw new Error("check attribute missing");
  }
}

/**
 * @param {Partial<CheckOptions>} check
 * @param {AHActor} actor
 * @param {AHItem} item
 * @param {CheckPrepareCallback} onPrepare
 * @return {Promise<CheckOptions>}
 */
async function prepareCheck(check, actor, item, onPrepare) {
  // Define the check structure
  initializeCheckDefaults(check);

  // Set initial targets (actions without rolls can have targeting)
  const config = new ActionConfig(check);
  config.setDefaultTargets();

  // Initial callback
  await (onPrepare ? onPrepare(check, actor, item) : undefined);

  // ObjectUtils.lockAndValidateProperty(check, "type");
  // ObjectUtils.lockAndValidateProperty(check, "id", false);

  await invokeWithCallbacks(AH.hooks.PREPARE_CHECK, check, actor, item);
  await Events.prepareCheck(check, actor, item);

  validateCheckAttributes(check);

  return check;
}

/**
 * @param {CheckOptions} check
 * @param {AHActor} actor
 * @return {Promise<Roll>}
 */
async function rollCheck(check, actor) {
  const { primary, secondary, modifiers } = check;

  /** @type AttributesDataModel */
  const attributes = actor.system.attributes;
  let primaryDice = attributes[primary].current;
  let secondaryDice = attributes[secondary].current;

  const modifierTotal = modifiers.reduce((agg, curr) => (agg += curr.value), 0);
  let modPart = "";
  if (modifierTotal > 0) {
    modPart = ` + ${modifierTotal}`;
  } else if (modifierTotal < 0) {
    modPart = ` - ${Math.abs(modifierTotal)}`;
  }
  const formula = `d${primaryDice}[${primary}] + d${secondaryDice}[${secondary}]${modPart}`;

  return new Roll(formula).roll();
}

/**
 * @param {RollTerm} term
 * @param {AHActor} actor
 * @return {AttributeDieRoll}
 */
const extractDieResults = (term, actor) => {
  if (term instanceof DiceTerm) {
    return {
      dice: term.faces,
      result: term.total,
    };
  } else if (term instanceof NumericTerm) {
    return {
      attribute: term.flavor,
      dice: term.options.faces ?? actor.system.attributes[term.flavor].current,
      result: term.total,
    };
  } else {
    throw new Error(`Unexpected formula term for primary attribute: ${term}`);
  }
};

/**
 * @param {CheckOptions} check
 * @param {Roll} roll
 * @param {AHActor} actor
 * @param {AHItem} item
 * @param {Boolean} callHook
 * @return {Promise<Readonly<CheckResult>>}
 */
const processResult = async (check, roll, actor, item, callHook = true) => {
  if (!roll._evaluated) {
    await roll.roll();
  }

  const primary = extractDieResults(roll.terms[0], actor);
  const secondary = extractDieResults(roll.terms[2], actor);
  const highRoll = primary.result > secondary.result ? primary : secondary;

  const critThreshold = check.critThreshold ?? Formulas.CRITICAL_THRESHOLD;

  /**
   * @type {Readonly<CheckResult>}
   */
  const result = Object.freeze({
    type: check.type,
    id: check.id,
    actorUuid: actor.uuid,
    itemUuid: item?.uuid,
    itemName: item?.name,
    sourceInfo: SourceInfo.fromInstance(actor, item),
    roll: roll.toJSON(),
    additionalRolls: [],
    primary: Object.freeze({
      attribute: check.primary,
      dice: primary.dice,
      result: primary.result,
    }),
    secondary: Object.freeze({
      attribute: check.secondary,
      dice: secondary.dice,
      result: secondary.result,
    }),
    hr: highRoll,
    generateOpportunity: check.generateOpportunity ?? true,
    modifiers: Object.freeze(check.modifiers.map(Object.freeze)),
    modifierTotal: check.modifiers.reduce((agg, curr) => agg + curr.value, 0),
    critThreshold: critThreshold,
    total: roll.total,
    fumble: (primary.result === 1) && (secondary.result === 1),
    critical: (primary.result === secondary.result) && (primary.result >= Math.max(2, critThreshold)),
    data: check.data,
  });

  if (callHook) {
    await invokeWithCallbacks(AH.hooks.PROCESS_CHECK, result, actor, item);
    const config = new ActionConfig(check);
    await invokeWithCallbacks(AH.hooks.PROCESS_ACTION, config, actor, item);
  }

  return result;
};

/**
 * @param {CheckResult} result
 * @param {AHActor} actor
 * @param {AHItem} item
 * @param {Record<string, any>} [flags]
 * @return {Promise<void>}
 */
async function renderCheck(result, actor, item, flags = {}) {
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
  const config = new ActionConfig(result);

  Hooks.callAll(AH.hooks.RENDER_ACTION, config, builderData, actor, item);
  Hooks.callAll(AH.hooks.RENDER_CHECK, builderData, result, actor, item);
  await Events.renderAction(builderData, config, actor, item);

  if (result.generateOpportunity) {
    if (result.critical) {
      Events.opportunity(builderData, actor, result.type, item, false);
    } else if (result.fumble) {
      Events.opportunity(builderData, actor, result.type, item, true);
    }
  }

  // CHECK Section
  builderData.sections.push({
    order: ChatSectionOrder.roll,
    partial: systemTemplatePath("chat/chat-section-check"),
    data: {
      result: result,
      difficulty: config.getDifficulty(),
    },
  });

  // Flags
  await Actions.addSections(builderData, config);

  const chatBuilder = new ChatMessageBuilder(actor, item).withData(builderData).withFlags(flags);

  // Roll data
  const rolls = [result.roll, ...result.additionalRolls].filter(Boolean);
  chatBuilder.withRolls(rolls);

  // Create the chat message
  return chatBuilder.create();
}

/**
 * A pipeline for executing checks during play.
 */
export default class Checks {
  /**
   * @param {Partial<CheckOptions>} check
   * @param {AHActor} actor
   * @param {AHItem} item
   * @param {CheckPrepareCallback} onPrepare
   * @param {CheckResultCallback} onRender
   */
  static async performCheck(check, actor, item, onPrepare = undefined, onRender = undefined) {
    const preparedCheck = await prepareCheck(check, actor, item, onPrepare);
    const config = new ActionConfig(check);
    await Events.performAction(config, actor, item);
    const roll = await rollCheck(preparedCheck, actor);
    const result = await processResult(preparedCheck, roll, actor, item);
    await renderCheck(result, actor, item);
    if (onRender) {
      await onRender(result);
    }
    Events.resolveAction(new ActionInspector(config.check), actor, item);
  }

  /**
   * @param {AHActor} actor
   * @param {CheckAttributes} attributes
   * @param {AHItem} item
   * @param {CheckPrepareCallback} [configCallback]
   * @param {CheckResultCallback} onPerform
   */
  static async attributeCheck(actor, attributes, item, configCallback, onPerform) {
    /** @type Partial<CheckOptions> */
    const check = {
      type: "attribute",
      primary: attributes.primary,
      secondary: attributes.secondary,
    };

    return Checks.performCheck(check, actor, item, configCallback, onPerform);
  }

  /**
   * @param {AHActor} actor
   * @param {CheckAttributes} attributes
   * @param {CheckPrepareCallback} [configCallback]
   */
  static async openCheck(actor, attributes, configCallback) {
    /** @type Partial<CheckOptions> */
    const check = {
      type: "open",
      primary: attributes.primary,
      secondary: attributes.secondary,
    };

    return Checks.performCheck(check, actor, undefined, configCallback);
  }

  /**
   * @param {AHActor} actor
   * @param {AHItem} item
   * @param {CheckPrepareCallback} onPrepare
   */
  static async actionCheck(actor, item, onPrepare) {
    /** @type Partial<CheckOptions> */
    const check = {
      type: "action",
    };

    return Checks.performCheck(check, actor, item, onPrepare);
  }
}
