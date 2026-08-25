const { SchemaField, ArrayField, ObjectField, TypedObjectField, StringField, BooleanField, NumberField, HTMLField, EmbeddedDataField } = foundry.data.fields;

/**
 * @property {String} actor The actor uuid.
 * @property {IntentAction[]} actions The actions (by intent) taken by the actor.
 */
class ActorRoundHistory extends foundry.data.fields.DataField {
  static defineSchema() {
    return {
      actor: new StringField(),
      intents: new ArrayField(new StringField()),
    };
  }
}

/**
 * @property {Number} round
 * @property {ActorRoundHistory[]} actors
 */
class CombatRoundHistory extends foundry.data.fields.DataField {
  static defineSchema() {
    return {
      round: new NumberField(),
      actors: new ArrayField(new ActorRoundHistory(), {}),
    };
  }
}

/**
 * A model to store system-specific information about combats.
 * @property {CombatRoundHistory[]} rounds
 */
export default class CombatDataModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this Combat subtype.
   */
  static get metadata() {
    return {
      type: "base",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {
      rounds: new ArrayField(new CombatRoundHistory(), {}),
    };
  }

  /**
   * @param {CombatRoundHistory} data
   */
  async addRoundHistory(data) {
    const current = this.rounds;
    current.push(data);
    return this.parent.update({ "system.rounds": current });
  }

}
