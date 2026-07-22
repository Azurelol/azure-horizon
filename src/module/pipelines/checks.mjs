import { Events } from "./_module.mjs";
import { ChatMessageBuilder, ChatSectionOrder, CheckConfigurer } from "../helpers/_module.mjs";
import { Hooks } from "../data/common/_module.mjs";
import { Formulas } from "../ruleset/_module.mjs";
import { renderTemplate, systemTemplatePath } from "../constants.mjs";
import { ObjectUtils, StringUtils } from "../utils/_module.mjs";
import AH from "../config.mjs";

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
 * @typedef Check
 * @property {CheckType} type the type of the check
 * @property {CheckId} id a unique identifier for this check
 * @property {CheckModifier[]} modifiers array of modifiers
 * @property {Object} data additional data attached to the check
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
 * @property {Roll | Object} roll the Roll instance or serialized form of the primary check
 * @property {(Roll | Object)[]} additionalRolls any secondary rolls, either as Roll instances or serialized
 * @property {AttributeDieRoll} primary
 * @property {AttributeDieRoll} secondary
 * @property {number} modifierTotal the sum of all modifier
 * @property {number} result the total result of the check
 * @property {boolean} fumble
 * @property {boolean} critical
 */

/**
 * @callback CheckCallback
 * @param {CheckOptions} check
 * @param {AHActor} actor
 * @param {AHItem} item
 * @return {Promise | void}
 */

/**
 * @callback CheckResultCallback
 * @param {CheckResult} result
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
 * @param {CheckCallback} initialConfigCallback
 * @return {Promise<CheckOptions>}
 */
async function prepareCheck(check, actor, item, initialConfigCallback) {
  // Define the check structure
  initializeCheckDefaults(check);

  // Set initial targets (actions without rolls can have targeting)
  const config = new CheckConfigurer(check);
  config.setDefaultTargets();

  // Initial callback
  await (initialConfigCallback ? initialConfigCallback(check, actor, item) : undefined);

  ObjectUtils.lockAndValidateProperty(check, "type");
  ObjectUtils.lockAndValidateProperty(check, "id", false);

  await invokeWithCallbacks(Hooks.PREPARE_CHECK, check, actor, item);
  await Events.initializeAction(config, actor, item);

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
 * @return {{result: number, dice: number}}
 */
const extractDieResults = (term, actor) => {
  if (term instanceof DiceTerm) {
    return {
      dice: term.faces,
      result: term.total,
    };
  } else if (term instanceof NumericTerm) {
    return {
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
    generateOpportunity: check.generateOpportunity ?? true,
    modifiers: Object.freeze(check.modifiers.map(Object.freeze)),
    modifierTotal: check.modifiers.reduce((agg, curr) => agg + curr.value, 0),
    critThreshold: critThreshold,
    result: roll.total,
    fumble: (primary.result === 1) && (secondary.result === 1),
    critical: (primary.result === secondary.result) && (primary.result >= Math.max(2, critThreshold)),
    data: check.data,
  });

  if (callHook) {
    await invokeWithCallbacks(Hooks.PROCESS_CHECK, result, actor, item);
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
  };
  const config = new CheckConfigurer(result);

  Hooks.callAll(Hooks.RENDER_CHECK, builderData, result, actor, item);
  await Events.renderAction(builderData, config, actor, item);

  if (result.generateOpportunity) {
    if (result.critical) {
      Events.opportunity(builderData, actor, result.type, item, false);
    } else if (result.fumble) {
      Events.opportunity(builderData, actor, result.type, item, true);
    }
  }

  // Roll Section
  builderData.sections.push({
    order: ChatSectionOrder.roll,
    partial: systemTemplatePath("chat/chat-section-check"),
    data: {
      result: result,
      difficulty: config.getDifficulty(),
    },
  });

  // Create the chat builder
  const chatBuilder = new ChatMessageBuilder(actor, item).withData(builderData).withFlags(flags);

  // Add flavor
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
    let flavorTitle = StringUtils.localize(AH.checkTypes[result.type] || "AH.CHECK.Check");
    const itemRef = config.getItemReference();
    let referencedItem;
    if (itemRef) {
      referencedItem = await fromUuid(itemRef);
      flavorTitle += ` - ${referencedItem.name}`;
    }
    flavor = await renderTemplate("chat/chat-section-flavor", {
      title: flavorTitle,
      type: result.type,
      item: referencedItem,
      label: config.getLabel(),
    });
  }
  chatBuilder.withFlavor(flavor);

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
   * @param {CheckCallback} [prepareCheckCallback]
   * @param {CheckResultCallback} renderCheckCallback
   */
  static async performCheck(check, actor, item, prepareCheckCallback = undefined, renderCheckCallback = undefined) {
    const preparedCheck = await prepareCheck(check, actor, item, prepareCheckCallback);
    await Events.performAction(check, actor, item);
    const roll = await rollCheck(preparedCheck, actor);
    const result = await processResult(preparedCheck, roll, actor, item);
    await renderCheck(result, actor, item);
    if (renderCheckCallback) {
      await renderCheckCallback(result);
    }
    Events.resolveAction(result, actor, item);
  }

  /**
   * @param {AHActor} actor
   * @param {CheckAttributes} attributes
   * @param {AHItem} item
   * @param {CheckCallback} [configCallback]
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
   * @param {CheckCallback} [configCallback]
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

}
