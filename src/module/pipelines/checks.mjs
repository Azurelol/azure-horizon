/**
 * @typedef {string} CheckId
 */

/**
 * @typedef CheckAttributes
 * @property {Attribute} primary
 * @property {Attribute} secondary
 */

/**
 * @typedef CheckModifier
 * @property {string} label the label or localization key for this modifier
 * @property {number} value the value of this modifier
 */

/**
 * @typedef Check
 * @property {CheckType} type the type of the check
 * @property {CheckId} id a unique identifier for this check
 * @property {CheckModifier[]} modifiers array of modifiers
 * @property {Object} data additional data attached to the check
 * @property {Boolean} generateOpportunity Whether this check can generate an opportunity.
 */

/**
 * @typedef {Check} CheckData the basic configuration of the check. This object is sealed
 * @property {Attribute} primary the first attribute
 * @property {Attribute} secondary the second attribute
 */

/**
 * @typedef {Check} CheckResult
 * @property {string} actorUuid
 * @property {string} itemUuid
 * @property {string} itemName
 * @property {Roll | Object} roll the Roll instance or serialized form of the primary check
 * @property {(Roll | Object)[]} additionalRolls any secondary rolls, either as Roll instances or serialized
 * @property {Attribute} primary.attribute the first attribute
 * @property {number} primary.dice the dice corresponding to the first attribute
 * @property {number} primary.result the result of the primary die
 * @property {Attribute} secondary.attribute the second attribute
 * @property {number} secondary.dice the dice corresponding to the second attribute
 * @property {number} secondary.result the result of the secondary die
 * @property {number} modifierTotal the sum of all modifier
 * @property {number} critThreshold the crit threshold for this check, default 6s
 * @property {number} result the total result of the check
 * @property {boolean} fumble
 * @property {boolean} critical
 */

/**
 * @callback CheckCallback
 * @param {CheckData} check
 * @param {AHActor} actor
 * @param {AHItem} item
 * @return {Promise | void}
 */

/**
 * @callback CheckResultCallback
 * @param {CheckResult} result
 * @return {Promise | void}
 */

export default class Checks {

  /**
   * @param {AHActor} actor
   * @param {CheckAttributes} attributes
   * @param {AHItem} item
   * @param {CheckCallback} [configCallback]
   * @param {CheckResultCallback} onPerform
   */
  async attributeCheck(actor, attributes, item, configCallback, onPerform) {
    /** @type Partial<CheckData> */
    const check = {
      type: "attribute",
      primary: attributes.primary,
      secondary: attributes.secondary,
    };

    return performCheck(check, actor, item, configCallback, onPerform);
  }

  /**
   * @param {AHActor} actor
   * @param {CheckAttributes} attributes
   * @param {CheckCallback} [configCallback]
   */
  async openCheck(actor, attributes, configCallback) {
    /** @type Partial<CheckData> */
    const check = {
      type: "open",
      primary: attributes.primary,
      secondary: attributes.secondary,
    };

    return performCheck(check, actor, undefined, configCallback);
  }

}
