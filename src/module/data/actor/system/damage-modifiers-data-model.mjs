import { VersionedDataModel } from "../../api/_module.mjs";
import { ExchangeModifiersDataModel } from "../../api/modifiers.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

export default class DamageModifiersDataModel extends VersionedDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      all: new EmbeddedDataField(ExchangeModifiersDataModel, {}),
      physical: new EmbeddedDataField(ExchangeModifiersDataModel, {}),
    });
  }

  /**
   * @param {DamageData} damage
   */
  collectModifiers(damage) {
    /** @type DamageModifier[] **/
    let modifiers = [];
  }

  resolveModifiers() {

  }
}
