
import { isActorType, isItemType } from "../constants.mjs";
import DocumentMixin from "./document-mixin.mjs";

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
 * @property {ActiveEffectModel} system
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

    // If no source info is provided, it could have been created directly
    // if (!data.flags?.ah?.source && data.origin) {
    //   /** @type AHItem **/
    //   const compendiumItem = await fromUuid(data.origin);
    //   const sourceInfo = new SourceInfo(compendiumItem.name, null, compendiumItem.uuid, null, compendiumItem.system.slug);
    //   changes.flags = new FlagBuilder().set(Flags.ActiveEffect.Source, sourceInfo);
    // }

    this.updateSource(changes);
    return super._preCreate(data, options, user);
  }

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
