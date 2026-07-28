/**
 * A simple extension that adds a hook at the end of data prep.
 * @property {AH_ActorType} type
 * @property {String} name
 * @property {String} uuid
 * @property {String} id The canonical identifier for this Document.
 * @property {Map<String, AHItem>} items <Uuid, *>
 * @property {Map<String, FUActiveEffect>} effects <Uuid, *>
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
      source.type = "base";
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

  /**
   * @param {AH_RestType} type
   * @return Promise
   */
  async rest(type = "long") {
    const mhp = this.system.parameters.hp?.max;
    const mmp = this.system.parameters.mp?.max;
    const mtp = this.system.parameters.ip?.max;

    let hp, mp, tp;
    switch (type) {
      case "long":
        hp = mhp;
        mp = mmp;
        tp = 0;
        break;

      case "short":
        hp = Math.min(hp + (mhp * 2), mhp);
        mp = Math.min(mp + (mmp * 2), mhp);
        tp = Math.max(tp - 5, mtp);
        break;
    }

    const updateData = {
      "system.parameters.hp.value": hp,
      "system.parameters.mp.value": mp,
      "system.parameters.tp.value": tp,
    };
    await this.update(updateData);
  }

}
