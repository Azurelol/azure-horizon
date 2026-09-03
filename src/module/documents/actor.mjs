import DocumentMixin from "./document-mixin.mjs";
import AH from "../config.mjs";
import { statusEffects } from "../data/effect/_module.mjs";
import { FlagBuilder } from "../helpers/_module.mjs";
import { SourceInfo } from "../data/common/_module.mjs";
import { ObjectUtils } from "../utils/_module.mjs";
import Events from "../pipelines/events.mjs";
import { isItemType } from "../constants.mjs";

/**
 * @typedef ActorData
 * @property {string|null} _id            The _id which uniquely identifies this Actor document
 * @property {string} name                The name of this Actor
 * @property {string} type                An Actor subtype which configures the system data model applied
 * @property {string} [img]               An image file path which provides the artwork for this Actor
 * @property {object} system              Data for an Actor subtype, defined by a System or Module
 * @property {PrototypeTokenData} prototypeToken Default Token settings which are used for Tokens created from
 *                                               this Actor
 * @property {ItemData[]} items           A Collection of Item embedded Documents
 * @property {ActiveEffectData[]} effects A Collection of ActiveEffect embedded Documents
 * @property {string|null} folder         The _id of a Folder which contains this Actor
 * @property {number} sort                The numeric sort value which orders this Actor relative to its siblings
 * @property {object} ownership           An object which configures ownership of this Actor
 * @property {DocumentFlags} flags        An object of optional key/value flags
 * @property {DocumentStats} _stats       An object of creation and access information
 */

/**
 * A simple extension that adds a hook at the end of data prep.
 * @extends ActorData
 * @property {AH_ActorType} type
 * @property {String} name
 * @property {String} uuid
 * @property {String} id The canonical identifier for this Document.
 * @property {DataModel} system
 * @property {Map<String, AHItem>} items <Uuid, *>
 * @property {Map<String, AHActiveEffect>} effects <Uuid, *>
 * @property {AHActiveEffect[]} appliedEffects
 * @property {AHActiveEffect[]} temporaryEffects
 * @property {Boolean} isOwner True if the user has ownership of the actor.
 */
export class AHActor extends DocumentMixin(foundry.documents.Actor) {

  static CHARACTER_TYPES = new Set(["hero", "adversary"]);
  static ENTITY_TYPES = new Set(["hero", "adversary", "follower", "entity"]);

  /*-------------------------------------------------------------------------*/

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHActor} actor      The actor preparing derived data.
     */
    Hooks.callAll("AH.prepareActorData", this);
  }

  static migrateData(source) {
    source = super.migrateData(source);
    return source;
  }

  /**
   * @override
   */
  async _preUpdate(changed, options, user) {
    if (changed) {
      if (this.isCharacterType && changed.system) {
        // If the level was changed, reset resources?
        if (("level" in changed.system) && (changed.system.level !== this.system.level)) {
          // TODO: Fix to execute after calculation
          this.system.level = changed.system.level;
          const restData = this.#calculateRest("long");
          ObjectUtils.mergeObject(changed, restData);
        }
      }
    }
    await super._preUpdate(changed, options, user);
  }

  /**
   * @override
   */
  async _onUpdate(changed, options, userId) {
    if (this.isCharacterType) {
      const { hp } = this.system?.resources || {};
      if (hp && (userId === game.userId)) {
        await this.onHitPointChange();
      }
    }
    super._onUpdate(changed, options, userId);
  }

  /**
   * Handle how changes to a Token attribute bar are applied to the Actor.
   * This allows for game systems to override this behavior and deploy special logic.
   * @param {string} attribute    The attribute path
   * @param {number} value        The target attribute value
   * @param {boolean} isDelta     Whether the number represents a relative change (true) or an absolute change (false)
   * @param {boolean} isBar       Whether the new value is part of an attribute bar, or just a direct value
   * @returns {Promise<Actor>}    The updated Actor document
   */
  async modifyTokenAttribute(attribute, value, isDelta = false, isBar = true) {
    return super.modifyTokenAttribute(attribute, value, isDelta);
  }

  /**
   * Get all ActiveEffects that may apply to this Actor, filtered to exclude [whatever].
   * @override
   * @yields {AHActiveEffect}
   * @returns {Generator<AHActiveEffect, void, void>}
   * @remarks Filters out [specific reason] from the base implementation
   */
  *allApplicableEffects() {
    for (const effect of super.allApplicableEffects()) {
      if (this._shouldExcludeEffect(effect)) continue;
      yield effect;
    }
  }

  /*-------------------------------------------------------------------------*/

  /**
   * @param {AHActiveEffect} effect
   * @returns {boolean}
   */
  _shouldExcludeEffect(effect) {
    if (!this.system.shouldExcludeEffect) {
      return false;
    }
    return this.system.shouldExcludeEffect(effect);
  }

  /**
   * @typedef TrackerLookup
   * @property {AHActor|AHItem|AHActiveEffect} document
   * @property {TrackerDataModel} tracker
   */

  /**
   * @description Resolves a tracker with the given id among the actor's items and effects.
   * @param {String} id
   * @returns {TrackerLookup}
   */
  resolveTracker(id) {
    // Search items
    const items = this.items.values();
    for (const item of items) {
      const lookup = item.resolveTracker(id);
      if (lookup) {
        return lookup;
      }
    }
    // Search active effects: match the id on the progress track
    for (const effect of this.allApplicableEffects()) {
      if (effect.system.tracker?.enabled) {
        const tracker = effect.system.tracker;
        if ((tracker.id === id) || (tracker.parent.parent.id === id)) {
          return {
            document: effect,
            tracker: tracker,
          };
        }
      }
    }
    return undefined;
  }

  /**
   * @param {String} id
   * @returns {AHItem}
   */
  resolveItem(id) {
    return this.items.filter((i) => i.id === id)[0];
  }

  /**
   * @param {String} id The name of the effect, one of its statuses, or its slug.
   * @returns {AHActiveEffect}
   */
  resolveEffect(id) {
    id = id.toLowerCase();
    return Array.from(this.allApplicableEffects()).find((effect) => {
      return effect.matches(id);
    });
  }

  /**
   * A helper function to toggle a status effect on an Actor.
   * Designed based off TokenDocument#toggleActiveEffect to properly interact with token hud.
   * @param {string} statusEffectId The status effect id based on CONFIG.statusEffects
   * @param {SourceInfo} sourceInfo
   * @param {AH_ActiveEffectConfiguration} config
   * @returns {Promise<boolean>} Whether the ActiveEffect is now on or off
   */
  async toggleStatusEffect(statusEffectId, sourceInfo = undefined, config = undefined) {
    if (!this.isCharacterType) {
      ui.notifications.error("AH.DIALOG.WARNING.EffectsNotSupported", { localize: true });
      return false;
    }
    const existing = this.effects.filter((effect) => AHActor.isStatusEffect(effect, statusEffectId));
    if (existing.length > 0) {
      await Promise.all(
        existing.map((e) => {
          Events.status(this, statusEffectId, false);
          //sendToChatEffectRemoved(e, this);
          return e.delete();
        }),
      );
      return false;
    } else {
      await this.createStatusEffect(statusEffectId, sourceInfo, config);
      return true;
    }
  }

  /**
   * @param {string} statusEffectId The status effect id based on CONFIG.statusEffects
   * @param {SourceInfo} sourceInfo
   * @param {AH_ActiveEffectConfiguration} config
   * @returns {Promise<boolean>}
   */
  async createStatusEffect(statusEffectId, sourceInfo, config) {
    if (!this.isCharacterType) {
      ui.notifications.error("AH.DIALOG.WARNING.EffectsNotSupported", { localize: true });
      return false;
    }
    const statusEffect = AHActor.resolveStatusEffect(statusEffectId);
    if (statusEffect) {
      // eslint-disable-next-line no-undef
      const instance = await ActiveEffect.create(
        {
          ...statusEffect,
          statuses: [statusEffectId],
          flags: this.createEffectFlags(statusEffect, sourceInfo, statusEffectId, true),
        },
        { parent: this },
      );
      await instance.applyConfiguration(config);
      Events.status(this, statusEffectId, true);
    }
    return true;
  }

  /**
   * @param {ActiveEffectData} effect
   * @param {SourceInfo} sourceInfo
   * @param {String} identifier An unique identifier for the effect
   * @param {Boolean} temporary
   * @returns {Object}
   */
  createEffectFlags(effect, sourceInfo, identifier, temporary) {
    const fb = new FlagBuilder();
    if (temporary) {
      fb.set(AH.flags.ActiveEffect.Temporary, true);
    }
    fb.set(AH.flags.ActiveEffect.Source, sourceInfo);
    fb.set(AH.flags.ActiveEffect.Identifier, identifier);
    return fb.toObject();
  }

  // TODO: Factor out
  /**
   * @param {String} id
   * @return {ActiveEffectData}
   */
  static resolveStatusEffect(id) {
    return statusEffects.entries[id];
  }

  // TODO: Factor out
  /**
   * @param {AHActiveEffect} effect
   * @param {String} statusEffectId
   * @returns {boolean}
   */
  static isStatusEffect(effect, statusEffectId) {
    return effect.statuses.has(statusEffectId);
  }

  /**
   * Applies crisis to the character.
   * @returns {Promise<void>}
   */
  async onHitPointChange() {
    if (this.isCharacterType) {
      const { hp } = this.system?.resources || {};
      if (hp) {
        // Check KO
        const shouldBeKO = hp.value === 0;
        const isKO = this.statuses.has("ko");
        if (shouldBeKO !== isKO) {
          Hooks.call(
            AH.hooks.DEFEAT_EVENT,
            /** @type DefeatEvent **/
            {
              actor: this,
              token: this.resolveToken(),
            },
          );
          await this.toggleStatusEffect("ko", SourceInfo.fromInstance(this));
        }
        // Check CRISIS status
        if (this.system.crisis !== this.statuses.has("crisis")) {
          Hooks.call(
            AH.hooks.CRISIS_EVENT,
            /** @type CrisisEvent **/
            {
              actor: this,
              token: this.resolveToken(),
            },
          );
          await this.toggleStatusEffect("crisis", SourceInfo.fromInstance(this));
        }
      }
    }
  }

  /*-------------------------------------------------------------------------*/

  /**
   * @returns {Token}
   * @remarks https://foundryvtt.com/api/classes/client.TokenDocument.html
   */
  resolveToken() {
    // For unlinked actors (usually NPCs)
    if (this.token) {
      return this.token.object;
    }
    // For linked actors (PCs, sometimes villains?)
    const tokens = this.getActiveTokens();
    if (tokens) {
      return tokens[0];
    }
    throw Error(`Failed to get token for ${this.uuid}`);
  }

  /**
   * @returns {String}
   */
  resolveUuid() {
    let uuid = this.uuid;
    if (this.token && this.token.baseActor) {
      uuid = this.token.baseActor.uuid;
    }
    return uuid;
  }

  /**
   * @param {AH_ItemType} type
   */
  supportsItemType(type) {
    return this.system.supportsItemType(type);
  }

  /**
   * @param {...AH_ItemType} types
   * @returns {AHItem[]}
   */
  getItemsByType(...types) {
    const set = new Set(types);
    const result = [];
    for (const item of this.items.values()) {
      if (set.has(item.type)) result.push(item);
    }
    return result;
  }

  /**
   * @param {String} slug
   * @param {AH_ItemType} type
   * @return {AHItem[]}
   */
  resolveItemsBySlug(slug, type) {
    const slugFilter = (i) => i.system.slug === slug;
    if (!type) return this.items.filter(slugFilter);
    const items = this.getItemsByType(type);
    return items.filter(slugFilter);
  }

  /**
   * @returns {boolean}
   */
  get isCharacterType() {
    return AHActor.CHARACTER_TYPES.has(this.type);
  }

  /**
   * @returns {boolean}
   */
  get isEntityType() {
    return AHActor.ENTITY_TYPES.has(this.type);
  }

  /*-------------------------------------------------------------------------*/

  /**
   * @param {AH_RestType} type
   * @returns {Object}
   */
  #calculateRest(type) {
    let hp, mp, tp, ip;

    const mhp = this.system.resources.hp?.max;
    const mmp = this.system.resources.mp?.max;
    const mtp = this.system.resources.tp?.max;
    const mip = this.system.resources.ip?.max;
    let thp = 0; // Always gets reset

    switch (type) {
      case "resupply":
        ip = mip;
        break;

      case "long":
        hp = mhp;
        mp = mmp;
        if (this.type === "hero") {
          tp = 0;
        }
        break;

      case "short":
        hp = this.system.resources.hp.value;
        hp = Math.min(hp + (mhp / 2), mhp);

        mp = this.system.resources.mp.value;
        mp = Math.min(mp + (mmp / 2), mmp);

        if (this.type === "hero") {
          tp = this.system.resources.tp.value;
          tp = Math.min(tp - 5, 0);
        }
        break;
    }

    let updateData = {};
    if (hp !== undefined) {
      updateData["system.resources.hp.value"] = hp;
    }
    if (mp !== undefined) {
      updateData["system.resources.mp.value"] = mp;
    }
    if (tp !== undefined) {
      updateData["system.resources.tp.value"] = tp;
    }
    if (ip !== undefined) {
      updateData["system.resources.ip.value"] = ip;
    }
    updateData["system.resources.hp.temporary"] = thp;
    return updateData;
  }

  /**
   * @param {AH_RestType} type
   * @return Promise
   */
  async rest(type = "long") {
    const updateData = this.#calculateRest(type);
    await this.update(updateData);
  }
}

Hooks.on("preCreateActor", (actor, data) => {
  const shouldLink = actor.type === "hero";
  const update = {
    "prototypeToken.actorLink": shouldLink,
    "prototypeToken.texture.fit": "cover",
  };
  actor.updateSource(update);
});
