/**
 * A document subclass adding system-specific behavior and registered in CONFIG.Token.documentClass.
 * @property {Boolean} inCombat An indicator for whether this Token is currently involved in the active combat encounter.
 * @property {AHCombatant} combatant Return a reference to a Combatant that represents this Token, if one is present in the current encounter.
 * @property {Boolean} isLinked A convenient reference for whether this TokenDocument is linked to the Actor it represents, or is a synthetic copy
 */
export class AHTokenDocument extends foundry.documents.TokenDocument {

  /* -------------------------------------------------- */

  /** @inheritdoc */
  getBarAttribute(barName, { alternative } = {}) {
    const bar = super.getBarAttribute(barName, { alternative });
    if (bar == null) return null;

    let { type, attribute, value, max, editable } = bar;

    const barData = { type, attribute, value, max, editable };
    if (barData?.attribute !== "hp") return barData;

    barData.min = this.actor.system.attributes.hp.max;
    barData.value += this.actor.system.attributes.hp.value || 0;

    return barData;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static _getTrackedAttributesFromSchema(schema, _path = []) {
    const attributes = { bar: [], value: [] };
    for (const [name, field] of Object.entries(schema.fields)) {
      const p = _path.concat([name]);
      if (field instanceof foundry.data.fields.NumberField) attributes.value.push(p);
      const isSchema = field instanceof foundry.data.fields.SchemaField;
      const isModel = field instanceof foundry.data.fields.EmbeddedDataField;
      if (isSchema || isModel) {
        const schema = isModel ? field.model.schema : field;
        const isBar = ((schema.has("value") || schema.has("spent")) && schema.has("max")) || schema.options.trackedAttribute;
        if (isBar) attributes.bar.push(p);
        else {
          const inner = this.getTrackedAttributes(schema, p);
          attributes.bar.push(...inner.bar);
          attributes.value.push(...inner.value);
        }
      }
    }
    return attributes;
  }
  /* -------------------------------------------- */
  /*  Combat Operations                           */
  /* -------------------------------------------- */
  /**
   * Create or remove Combatants for an array of provided Token objects.
   * @param {TokenDocument[]} tokens      The tokens which should be added to the Combat
   * @param {object} [options={}]         Options which modify the toggle operation
   * @param {Combat} [options.combat]       A specific Combat instance which should be modified. If undefined, the
   *                                        current active combat will be modified if one exists. Otherwise, a new
   *                                        Combat encounter will be created if the requesting user is a Gamemaster.
   * @returns {Promise<AHCombatant[]>}      An array of created Combatant documents
   * @override
   */
  static async createCombatants(tokens, { combat } = {}) {
    // Identify the target Combat encounter
    combat ??= game.combats.viewed;
    if (!combat) {
      if (game.user.isGM) {
        const cls = foundry.utils.getDocumentClass("Combat");
        combat = await cls.create({ active: true }, { render: false });
      }
      else throw new Error(_loc("COMBAT.NoneActive"));
    }

    // Add tokens to the Combat encounter, creating combatants for each
    // For adversaries, create additional combatants based on their rank.
    const createData = new Set(tokens).reduce((arr, token) => {
      if (token.inCombat) return arr;
      const combatant = { tokenId: token.id, sceneId: token.parent.id, actorId: token.actorId, hidden: token.hidden };
      const actor = token.actor;

      if (actor.type === "adversary") {
        /** @type AdversaryProfileDataModel **/
        const profileData = actor.system.profile;
        let turns;
        switch (profileData.rank) {
          case "minion":
            turns = 0;
            break;
          case "standard":
            turns = 1;
            break;
          case "elite":
            turns = 2;
            break;
          case "champion":
            turns = profileData.turns;
            break;
        }
        for (let t = 0; t < turns; t++) {
          arr.push(
            {
              ...combatant,
            },
          );
        }
      }
      else {
        arr.push(combatant);
      }
      return arr;
    }, []);
    return combat.createEmbeddedDocuments("Combatant", createData);
  }
}
