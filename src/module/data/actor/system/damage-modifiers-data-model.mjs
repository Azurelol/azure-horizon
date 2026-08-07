import { VersionedDataModel } from "../../api/_module.mjs";
import { ExchangeModifiersDataModel } from "../../api/modifiers.mjs";
import AH from "../../../config.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

/**
 * @property {ExchangeModifiersDataModel} all
 * @property {ExchangeModifiersDataModel} physical
 * @property {ExchangeModifiersDataModel} slashing
 * @property {ExchangeModifiersDataModel} bludgeoning
 * @property {ExchangeModifiersDataModel} piercing
 * @property {ExchangeModifiersDataModel} elemental
 * @property {ExchangeModifiersDataModel} fire
 * @property {ExchangeModifiersDataModel} cold
 */
export default class DamageModifiersDataModel extends VersionedDataModel {

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      all: new EmbeddedDataField(ExchangeModifiersDataModel, {}),

      physical: new EmbeddedDataField(ExchangeModifiersDataModel, {}),
      slashing: new EmbeddedDataField(ExchangeModifiersDataModel, {}),
      piercing: new EmbeddedDataField(ExchangeModifiersDataModel, {}),
      bludgeoning: new EmbeddedDataField(ExchangeModifiersDataModel, {}),

      elemental: new EmbeddedDataField(ExchangeModifiersDataModel, {}),
      fire: new EmbeddedDataField(ExchangeModifiersDataModel, {}),
    });
  }

  /**
   * @param {AH_DamageType} type
   * @param {AH_ModifierDirection} direction
   * @return {ParameterModifier[]}
   */
  resolve(type, direction) {

    /** @type ParameterModifier[] **/
    let modifiers = [];

    const group = AH.damageTypes[type]?.group;
    const layers = ["all", group, type].filter((key) => key && (key in this.schema.fields));

    for (const key of layers) {
      const resolved = this[key]?.[direction]?.resolveModifiers();
      if (!resolved) continue;
      modifiers.push(resolved);
    }

    return modifiers;
  }
}
