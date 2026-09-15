import { ModifiersDataModel, VersionedDataModel } from "../../api/_module.mjs";
import AH from "../../../config.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

/**
 * @property {ModifiersDataModel} universal Applies to all checks.
 * @property {ModifiersDataModel} action Attacks, spells, etc.
 * @property {ModifiersDataModel} attribute Attribute checks, mainly used outside during exploration.
 */
export default class CheckModifiersDataModel extends VersionedDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      universal: new EmbeddedDataField(ModifiersDataModel),
      action: new EmbeddedDataField(ModifiersDataModel),
      attribute: new EmbeddedDataField(ModifiersDataModel),
      defense: new EmbeddedDataField(ModifiersDataModel),
      ritual: new EmbeddedDataField(ModifiersDataModel),
    });
  }

  /**
   * @param {CheckType} type
   * @return {ParameterModifier[]}
   */
  resolve(type) {

    /** @type ParameterModifier[] **/
    let modifiers = [];
    const layers = ["universal", type].filter((key) => key && (key in this.schema.fields));
    for (const key of layers) {
      const resolved = this[key]?.resolveModifiers();
      if (!resolved || !resolved.length) continue;
      modifiers.push(...resolved);
    }

    return modifiers;
  }
}
