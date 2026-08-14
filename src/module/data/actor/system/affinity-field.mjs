import AH from "../../../config.mjs";

const { SchemaField, NumberField, StringField, EmbeddedDataField, ArrayField } = foundry.data.fields;

/**
 * Used for damage modifiers.
 * @property {AH_Affinity} preset
 * @property {AH_ModifierType} type
 * @property {Number} amount
 */
export default class AffinityField extends SchemaField {
  constructor(options = {}) {
    super({
      preset: new StringField({ initial: "", blank: true, choices: Object.keys(AH.affinities) }),
      type: new StringField({ initial: "additive", choices: Object.keys(AH.modifier.type) }),
      amount: new NumberField(),
    }, options);
  }
}
