// DSL supported by the inline amount expression
import { MathUtils, ObjectUtils, StringUtils } from "../utils/_module.mjs";
import { Formulas } from "../ruleset/_module.mjs";

const referenceSymbol = "@";
const itemLabel = "item";
const redirectSymbol = "~"; // If set, will evaluate it from the source

// Used for referencing
const sourceLabel = "source";
const actorLabel = "actor";
const targetLabel = "target";

function resolveActorFromLabel(match, label, context) {
  let actor;
  switch (label) {
    case actorLabel:
    case sourceLabel:
      context.assertActor(match);
      actor = context.actor;
      break;

    case targetLabel:
      context.assertSingleTarget(match);
      actor = context.targets[0];
      break;
  }
  return actor;
}

/**
 * @param {String} arg
 * @returns {String}
 */
function parseIdentifier(arg) {
  return arg.match(/(\w+-*\s*)+/gm)[0];
}

/**
 * @param {String} arg
 * @returns {Number}
 */
function parseNumber(arg) {
  return Number(arg.match(/-?\d+(\.\d+)?/gm)[0]);
}

/**
 * @param {AHActor} actor
 * @param {AH_Attribute} key
 * @returns {Promise<Roll>} Retrieve from total
 */
async function rollAttributeDie(actor, key) {
  const dice = getAttributeSize(actor, key);
  const formula = `d${dice}`;
  const roll = await new Roll(formula).roll();
  if (game.dice3d) {
    await game.dice3d.showForRoll(roll);
  }
  return roll;
}

/**
 * @type {[Function<String>]}
 */
const evaluationFunctions = [evaluateVariables, evaluateReferencedProperties, evaluateMacros];

/**
 * @description Evaluates special variables
 * @param {String} expression
 * @param {EvaluationContext} context
 * @returns {String}
 * */
function evaluateVariables(expression, context) {
  const pattern = /\$(?<symbol>\w+)/gm;
  function evaluate(match, symbol) {
    switch (symbol) {
      // Character level
      case "lvl": {
        context.assertActorOrTargets(match);
        return context.resolveActorOrHighestLevelTarget().system.level;
      }
      // Attributes
      case "mig":
      case "dex":
      case "wlp":
      case "ins": {
        return getAttributeSize(context.resolveActorOrHighestLevelTarget(), symbol);
      }
      // Resource: Current
      case "hp":
      case "mp": {
        return context.resolveActorOrHighestLevelTarget().system.resources[symbol].value;
      }
      // Resource: Max
      case "mhp":
      case "mmp": {
        return context.resolveActorOrHighestLevelTarget().system.resources[symbol].max;
      }
      // Target Count
      case "tc": {
        return context.targets.length;
      }
      // Skill level
      case "sl":
        context.assertItem(match);
        return context.item.system.level.current;
      // Check Result
      case "chk": {
        if (context.check) {
          return context.check.result;
        }
        return 0;
      }
      // Block amount for the character
      case "blk":{
        context.assertActor(match);
        const block = Formulas.calculateBlock(context.actor.system);
        return block.hp;
      }
      // High Roll of Check
      case "hr": {
        return getHighRoll(context.check);
      }
      // Tracker (From effect)
      case "pg": {
        context.assertEffect(match);
        return context.effect.system.tracker.current;
      }
      default:
        throw new Error(`Unsupported symbol ${symbol}`);
    }
  }
  return expression.replace(pattern, evaluate);
}

/**
 * @description Custom functions provided by the expression engine
 * @param {String} expression
 * @param {EvaluationContext} context
 * @returns {String}
 * @example &step(40,50,60)
 */
function evaluateMacros(expression, context) {
  const pattern = /~?&(?<name>[a-zA-Z]+)\((?<params>.*?)\)/gm;
  function evaluateMacro(match, name, params) {
    const redirect = match.startsWith(redirectSymbol);
    const splitArgs = params.split(",").map((i) => i.trim());
    switch (name) {
      // Attribute size
      case "ats": {
        const actor = context.resolveActorOrSource(match, redirect);
        const attribute = parseIdentifier(splitArgs[0]);
        return getAttributeSize(actor, attribute);
      }
      // Resource
      case "hp": {
        const percent = parseNumber(splitArgs[0]);
        const max = context.resolveActorOrHighestLevelTarget().system.resources.hp.max;
        return Formulas.round(percent * max);
      }
      case "mp": {
        const percent = parseNumber(splitArgs[0]);
        const max = context.resolveActorOrHighestLevelTarget().system.resources.mp.max;
        return Formulas.round(percent * max);
      }
      // Skill level
      case "sl": {
        const actor = context.resolveActorOrSource(match, redirect, false);
        if (!actor) {
          return 0;
        }
        const skillId = parseIdentifier(splitArgs[0]);
        const skills = actor.resolveItemsBySlug(skillId, "skill");
        const skill = skills[0];
        if (!skill) {
          ui.notifications.warn(`Did not resolve the skill ${skillId} on ${actor.name}`);
          return 0;
        }
        return skill.system.level.current;
      }
      // Tracker: Filled sections
      case "pg": {
        const actor = context.resolveActorOrSource(match, redirect);
        const id = parseIdentifier(splitArgs[0]);
        const clock = actor.resolveTracker(id).tracker;
        if (!clock) {
          ui.notifications.warn(`${StringUtils.localize("AH.CHAT.EvaluateNoProgress")}: '${id}'`, { localize: true });
          throw new Error(`The progress track with id ${id} was not found`);
        }
        return clock.current;
      }
      default:
        throw new Error(`Unsupported macro ${name}`);
    }
  }
  //return replaceAsync(expression, pattern, evaluateMacro);
  return expression.replace(pattern, evaluateMacro);
}

/**
 * @param {CheckResult} check
 * @returns {Number}
 */
function getHighRoll(check) {
  if (check) {
    if ((check.primary == null) && (check.secondary == null)) {
      return 0;
    } else if (check.primary == null) {
      return check.secondary.result;
    } else if (check.secondary == null) {
      return check.primary.result;
    }

    return Math.max(check.primary.result, check.secondary.result);
  }
  return 0;
}

/**
 * @param {AHActor} actor
 * @param {AH_Attribute} key
 * @returns {Number}
 */
function getAttributeSize(actor, key) {
  const attributes = actor.system.attributes;
  return attributes[key].current;
}

/**
 * Evaluates properties within the expression using the available context
 * @param {String}  expression
 * @param {EvaluationContext} context
 * @returns {Promise<String>}
 * @example @system.value.thingie
 */
function evaluateReferencedProperties(expression, context) {
  const pattern = /@(?<label>[a-zA-Z]+)\.(?<path>(\w+\.?)*)/gm;
  function evaluate(match, label, path, pN, offset, string, groups) {
    // TODO: Refactor
    let root = null;
    let propertyPath = `system.${path}`;
    const actorName = context.actor?.name ?? "unknown";

    switch (label) {
      // Check item
      case "item": {
        context.assertItem(match);
        root = context.item;
        propertyPath = match.replace(`${referenceSymbol}${itemLabel}`, "system");
        break;
      }
      // Check actors
      default: {
        const actor = resolveActorFromLabel(match, label, context);
        if (actor) {
          root = actor;
          propertyPath = match.replace(`${referenceSymbol}${label}`, "system");
        }
      }
    }

    // Evaluate the property value
    const propertyValue = ObjectUtils.getProperty(root, propertyPath);
    if (propertyValue === undefined) {
      throw new Error(`Unexpected variable "${propertyPath}" in object ${root}`);
    }
    if (propertyValue instanceof Object) {
      throw new Error(`Unexpected object returned from "${propertyPath}". It needs to be an integer!`);
    }
    console.info(`Resolved property @${label}.${path}: ${propertyValue}`);
    return propertyValue;
  }

  return expression.replace(pattern, evaluate);
}

/**
 * @type {[Promise<String>]}
 */
const asyncFunctions = [evaluateMacrosAsync];

/**
 * @description Custom async functions provided by the expression engine
 * @param {String} expression
 * @param {EvaluationContext} context
 * @returns {Promise<String>}
 * @example &step(40,50,60)
 */
async function evaluateMacrosAsync(expression, context) {
  const pattern = /\^(?<name>[a-zA-Z]+)\((?<params>.*?)\)/gm;
  async function evaluateMacro(match, name, params) {
    const splitArgs = params.split(",").map((i) => i.trim());
    switch (name) {
      // Attribute roll
      case "aroll": {
        context.assertActor(match);
        const attr = splitArgs[0];
        const roll = await rollAttributeDie(context.actor, attr);
        return roll.total;
      }
    }
  }
  return StringUtils.replaceAsync(expression, pattern, evaluateMacro);
}

/**
 * Provides evaluation of variables, macros and expressions to be used during pipelines (such as damage application).
 */
export default class Expressions {

  /**
   * @description Evaluates the given expression using the supported DSL
   * @param {String} expression
   * @param {EvaluationContext} context
   * @example (@actor.level.value*2+minor+@item.level.value)
   * @example @actor.byLevel(40,50,60)
   * @example (minor + 5)
   * @return {Number} The evaluated amount
   */
  static evaluate(expression, context) {
    if (!Expressions.requiresContext(expression)) {
      return Number(expression);
    }

    // Evaluate the expression over each function
    let substitutedExpression = expression;
    for (const fn of evaluationFunctions) {
      substitutedExpression = fn(substitutedExpression, context);
    }

    // Now that the expression's variables have been substituted, evaluate it arithmetically
    let result = MathUtils.evaluate(substitutedExpression);

    if (Number.isNaN(result)) {
      throw new Error(`Failed to evaluate expression ${substitutedExpression}`);
    }

    // FU always rounds down numbers
    result = Expressions.round(result);

    console.debug(`Evaluated expression ${expression} = ${substitutedExpression} = ${result}`);
    return result;
  }

  /**
   * @description Evaluates the given expression using a superset of the DSL
   * @param {String} expression
   * @param {EvaluationContext} context
   * @param {Boolean} applyRounding Whether to round the result, which is the default for FU.
   * @return {Promise<Number>} The evaluated amount
   */
  static async evaluateAsync(expression, context, applyRounding = true) {
    if (!Expressions.requiresContext(expression)) {
      return Number(expression);
    }

    let substitutedExpression = expression;
    // Evaluate the expression over each synchronous function
    for (const fn of evaluationFunctions) {
      substitutedExpression = fn(substitutedExpression, context);
    }
    // Evaluate the expression over each asynchronous function
    for (const fn of asyncFunctions) {
      substitutedExpression = await fn(substitutedExpression, context);
    }

    // Now that the expression's variables have been substituted, evaluate it arithmetically
    let result = Expressions.evaluate(substitutedExpression);

    if (Number.isNaN(result)) {
      throw new Error(`Failed to evaluate expression ${substitutedExpression}`);
    }

    // FU always rounds down numbers
    if (applyRounding) {
      result = Expressions.round(result);
    }

    console.debug(`Evaluated expression ${expression} = ${substitutedExpression} = ${result}`);
    return result;
  }

  /**
   * @param {Number|String} value
   * @remarks In FU, numbers are always rounded down>
   */
  static round(value) {
    if (Number.isNaN(value)) {
      return Math.floor(value);
    }
    return value;
  }

  /**
   * @param expression The raw text of the amount
   * @returns {boolean} True if the expression requires a context to be evaluated
   */
  static requiresContext(expression) {
    return !Number.isFinite(Number(expression));
  }

}
