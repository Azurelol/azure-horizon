import AH from "../../config.mjs";
import AttackDataModel from "./attack-data-model.mjs";

/**
 * A spell is a feature tied to a magical domain.
 * @property {AH_Domain} domain
 */
export default class SpellDataModel extends AttackDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      domain: new StringField({ initial: "",
        blank: true,
        label: "AH.FIELD.Domain",
        choices: Object.keys(AH.domains) }),
    });
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    config.addTraits(this.domain);
  }
}
