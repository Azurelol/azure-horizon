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
export class AHActor extends foundry.documents.Actor {

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
    if (source.type === "basic") {
      source.type = "useBase";
    }
    return source;
  }

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

  static CHARACTER_TYPES = new Set(["character", "adversary"]);

  /**
   * @returns {boolean}
   */
  isCharacterType() {
    return AHActor.CHARACTER_TYPES.has(this.type);
  }

  /**
   * @param {AH_RestType} type
   * @return Promise
   */
  async rest(type = "long") {

    let hp, mp, tp, ip;

    const mhp = this.system.parameters.hp?.max;
    const mmp = this.system.parameters.mp?.max;
    const mtp = this.system.parameters.tp?.max;
    const mip = this.system.parameters.ip?.max;

    switch (type) {
      case "resupply":
        ip = mip;
        break;

      case "long":
        hp = mhp;
        mp = mmp;
        if (this.type === "character") {
          tp = 0;
        }
        break;

      case "short":
        hp = this.system.parameters.hp.value;
        hp = Math.min(hp + (mhp / 2), mhp);

        mp = this.system.parameters.mp.value;
        mp = Math.min(mp + (mmp / 2), mmp);

        if (this.type === "character") {
          tp = this.system.parameters.tp.value;
          tp = Math.min(tp - 5, 0);
        }
        break;
    }

    let updateData = {};
    if (hp !== undefined) {
      updateData["system.parameters.hp.value"] = hp;
    }
    if (mp !== undefined) {
      updateData["system.parameters.mp.value"] = mp;
    }
    if (tp !== undefined) {
      updateData["system.parameters.tp.value"] = tp;
    }
    if (ip !== undefined) {
      updateData["system.parameters.ip.value"] = ip;
    }

    await this.update(updateData);
  }

}
