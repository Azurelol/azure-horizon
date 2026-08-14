import AH from "../../config.mjs";
import ActiveFeatureDataModel from "./active-feature-data-model.mjs";

/**
 * A spell is a feature tied to a magical domain.
 * @property {AH_Domain} domain Can also be empty for non-domain spells.
 * @property {AH_CastingSpeed} speed
 */
export default class SpellDataModel extends ActiveFeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      domain: new StringField({ initial: "",
        blank: true,
        label: "AH.FIELD.Domain",
        choices: Object.keys(AH.domains) }),
      speed: new StringField({ initial: "instant", blank: true, choices: Object.keys(AH.castingSpeed), required: true }),
    });
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    config.addTraits("spell");
    if (this.domain) {
      config.addTraits(this.domain);
    }
  }
}
