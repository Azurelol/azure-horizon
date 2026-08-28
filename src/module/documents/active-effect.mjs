
import { isActorType, isItemType, systemID } from "../constants.mjs";
import DocumentMixin from "./document-mixin.mjs";
import AH from "../config.mjs";
import { EvaluationContext } from "../data/common/_module.mjs";
import { Expressions } from "../pipelines/_module.mjs";

/**
 * @typedef EffectChangeData
 * @property {string} [key]    The attribute path in the Actor or Item data which the change modifies
 * @property {string} value    The value of the change effect
 * @property {string} type     The modification type of this change
 * @property {string} phase    The application phase under which this change is applied. Each phase is its own priority
 *                             group; that is, application of a change in an earlier phase will occur before a change in
 *                             a later phase, regardless of priority. A pair of phases are preconfigured, but a package
 *                             can add more phases to be called at different points during data preparation or on
 *                             certain events.
 * @property {number|null} priority The order in which this change is applied among other changes in a common phase: a
 *                                  null value is initialized to its default priority.
 */

/**
 * @typedef {Object} ActiveEffectData
 * @property {string} _id The unique identifier of the active effect.
 * @property {string} name - The name of the which describes the name of the ActiveEffect
 * @property {string} img - An image path used to 3depict the ActiveEffect as an icon
 * @property {EffectChangeData[]} changes - The array of EffectChangeData objects which the ActiveEffect applies
 * @property {boolean} disabled - Whether the active effect is disabled.
 * @property {EffectDurationData} duration - The duration data of the active effect.
 * @property {string} description - The description of the active effect.
 * @property {string} origin - A UUID reference to the document from which this ActiveEffect originated
 * @property {string} tint - A color string which applies a tint to the ActiveEffect icon
 * @property {Boolean} transfer - Does this ActiveEffect automatically transfer from an Item to an Actor?
 * @property {Set<string>} statuses - Special status IDs that pertain to this effect
 * @property {Object} flags - An object of optional key/value flags
 * @remarks https://foundryvtt.com/api/interfaces/foundry.types.ActiveEffectData.html
 */

/**
 * @typedef AH_ActiveEffectConfiguration
 * @property {String} name
 * @property {AH_EffectTracking} tracking t:
 * @property {Record<String, String>} updates Specific updates on initial data.
 */

/**
 * @typedef EffectDurationData
 * @property {ActiveEffectDurationUnit} units The time- or combat-based unit of the duration value
 * @property {number|null} value  The maximum duration of the Effect in the quantity of the unit, with null being
 *                                initialized to Infinity
 * @property {string|null} expiry An identifier of an event at which the Effect will expire: expiration occurs when both
 *                                the end of the duration and the expiry event are reached. A truly indefinite duration
 *                                is one in which both duration value and expiry are null.
 * @property {boolean} expired    Is this ActiveEffect expired?
 */

/**
 * @typedef ActiveEffect
 * @property {DataModel} parent
 * @property {Boolean} isSuppressed Is there some system logic that makes this active effect ineligible for application?
 * @property {Document} target Retrieve the Document that this ActiveEffect targets for modification.
 * @property {Boolean} active Whether the Active Effect currently applying its changes to the target.
 * @property {Boolean modifiesActor Does this Active Effect currently modify an Actor?
 * @property {Boolean} isTemporary Describe whether the ActiveEffect has a temporary duration based on combat turns or rounds.
 * @property {Boolean} isEmbedded Test whether this Document is embedded within a parent Document
 * @property {String} id Canonical name
 * @property {String} uuid
 * @property {String} name
 * @property {EffectDurationData} duration
 * @property {EffectChangeData[]} changes - The array of EffectChangeData objects which the ActiveEffect applies
 * @remarks https://foundryvtt.com/api/classes/client.ActiveEffect.html
 * @property {Function<Promise<Document>>} delete Delete this Document, removing it from the database.
 * @property {Function<void>} update Update this Document using incremental data, saving it to the database.
 * @property {Function<String, String, *, void>} setFlag Assign a "flag" to this document. Flags represent key-value type data which can be used to store flexible or arbitrary data required by either the core software, game systems, or user-created modules.
 * @property {Function<String, String, *>} getFlag Get the value of a "flag" for this document See the setFlag method for more details on flags
 */

const defaultImage = "icons/svg/aura.svg";

/**
 * A simple extension that adds a hook at the end of data prep.
 * @property {ActiveEffectDataModel} system
 * @property {AHActor|AHItem} parent
 * @property {Set<String>} statuses
 */
export class AHActiveEffect extends DocumentMixin(foundry.documents.ActiveEffect) {

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHActiveEffect} effect      The effect preparing derived data.
     */
    Hooks.callAll("AH.prepareActiveEffectData", this);
  }

  /*-------------------------------------------------------------------------*/

  /**
   * @private
   * @override
   * @remarks Unlike `_onCreate`, is managed by the GM.
   */
  async _preCreate(data, options, user) {
    //console.debug(`Created active effect ${this.name} on ${this.parent.name ?? "unknown"} with origin: ${this.origin}, source: ${this.sourceInfo ? this.sourceInfo.name : ""}, identifier: ${this.identifier}`);

    // TODO: Set up duration
    const changes = {
      name: game.i18n.localize(data.name),
      //["system.duration.remaining"]: this.system.duration.interval,
    };

    // Use default item image
    if (isItemType(this.parent) && (this.img === defaultImage)) {
      changes.img = this.parent.img;
    }

    this.updateSource(changes);
    return super._preCreate(data, options, user);
  }

  /**
   * Check if the effect's subtype has special handling, otherwise fallback to normal `duration` and `statuses` check.
   * @inheritdoc
   */
  get isTemporary() {
    if (this.getFlag(systemID, AH.flags.ActiveEffect.Temporary)) {
      return true;
    }
    return this.system._isTemporary ?? super.isTemporary;
  }

  static evaluateExpression(targetDoc, change) {
    if (change.value && (typeof change.value === "string")) {
      try {
        // First, evaluate using built-in support
        const expression = Roll.replaceFormulaData(change.value, this.parent);
        // Second, evaluate with our custom expressions
        const context = EvaluationContext.fromTarget(targetDoc, change.effect);
        const value = Expressions.evaluate(expression, context);
        change.value = String(value ?? 0);
      } catch (e) {
        console.error(e);
        ui.notifications?.error(
          game.i18n.format("AH.WARNING.EffectChangeInvalidFormula", {
            key: change.key,
            effect: this.name,
            target: targetDoc.name,
          }),
        );
        return {};
      }
    }
  }

  /**
   * Apply EffectChangeData to a field within a Document.
   * @param {Actor|Item|TokenDocument} targetDoc The model instance.
   * @param {EffectChangeData} change            The change to apply.
   * @param {object} [options]                   Additional options to configure the change application.
   * @param {DataField} [options.field]          The field: if not supplied, it will be retrieved from the supplied
   *                                             Document.
   * @param {Record<string, unknown>} [options.replacementData] Data used to resolve "@" expressions.
   * @param {boolean} [options.modifyTarget]     Modify the target Document with the updated value.
   * @returns {unknown} The updated value.
   */
  static applyChangeField(targetDoc, change, { field, replacementData = {}, modifyTarget = true } = {}) {
    AHActiveEffect.evaluateExpression(targetDoc, change);
    return super.applyChangeField(targetDoc, change, { field, replacementData, modifyTarget });
  }

  /**
   * If the current value is null, the change value is assigned directly.
   * If the current type is a string, the change value is concatenated.
   * If the current type is a number, the change value is cast to numeric and added.
   * If the current type is an array, the change value is appended to the existing array if it matches in type.
   *
   * @param {Actor|Item|TokenDocument} targetDoc The Document to which this effect should be applied
   * @param {EffectChangeData} change            The change data being applied
   * @param {unknown} current                    The current value being modified
   * @param {unknown} delta                      The parsed value of the change object
   * @param {object} changes                     An object which accumulates changes to be applied
   * @protected
   */
  static _applyChangeAdd(targetDoc, change, current, delta, changes) {
    AHActiveEffect.evaluateExpression(targetDoc, change);
    return super._applyChangeAdd(targetDoc, change, current, delta, changes);
  }

  /*-------------------------------------------------------------------------*/

  /**
   * @param {AH_ActiveEffectConfiguration} configuration
   * @returns {Promise<void>}
   */
  async applyConfiguration(configuration) {
    if (!configuration) {
      return;
    }
    const updates = configuration.updates ?? {};
    if (configuration.name) {
      updates["name"] = configuration.name;
    }
    if (configuration.event) {
      updates["system.duration.event"] = configuration.event;
    }
    if (configuration.interval) {
      updates["system.duration.interval"] = configuration.interval;
      updates["system.duration.remaining"] = configuration.interval;
    }
    if (configuration.tracking) {
      updates["system.duration.tracking"] = configuration.tracking;
    }
    if (Object.keys(updates).length > 0) {
      await this.update(updates);
    }
  }
}

// /**
//  * @param {AHActor} actor
//  * @param {EffectChangeData} change
//  * @param current
//  */
// function onApplyActiveEffect(actor, change, current) {
//   if (change.key.startsWith("system.") && (current instanceof foundry.abstract.DataModel && Object.hasOwn(current, change.value) && current[change.value] instanceof Function) {
//     console.debug(`Applying change ${change.value} to ${change.key}`);
//     current[change.value]();
//     return false;
//   }
// }
// Hooks.on("applyActiveEffect", onApplyActiveEffect);

Hooks.on("preCreateActiveEffect", (effect, options, userId) => {

  if (isActorType(effect.parent)) {
    /** @type AHActor **/
    const actor = effect.parent;
    // Prevent creation on non-character actor types
    if (!actor.isCharacterType) {
      ui.notifications.error("DIALOG.WARNING.EffectsNotSupported", { localize: true });
      return false;
    }
  }

  return true; // Allow the effect to be created
});
