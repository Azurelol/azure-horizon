import { Modifiers, VersionedDataModel } from "../api/_module.mjs";
import { CheckModifiersDataModel, ParameterDataModel } from "./system/_module.mjs";
import DamageModifiersDataModel from "./system/damage-modifiers-data-model.mjs";

/**
 * @property {ParameterDataModel} def
 * @property {ParameterDataModel} mdef
 * @property {DamageModifiersDataModel} damage
 * @property {CheckModifiersDataModel} check
 */
export class CharacterParametersDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      def: new EmbeddedDataField(ParameterDataModel, {}),
      mdef: new EmbeddedDataField(ParameterDataModel, {}),

      damage: new EmbeddedDataField(DamageModifiersDataModel, {}),
      check: new EmbeddedDataField(CheckModifiersDataModel, {}),
    });
  }

  /**
   * @typedef CharacterModifiers
   * @property {ModifierEntry[]} damage
   */

  /**
   * @returns {CharacterModifiers}
   */
  summarizeModifiers() {
    let result = {};
    result.damage = Modifiers.resolveFromModel(this.damage);
    return result;
  }

}
