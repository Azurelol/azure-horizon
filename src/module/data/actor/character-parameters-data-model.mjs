import { Modifiers, VersionedDataModel } from "../api/_module.mjs";
import { CheckModifiersDataModel, ParameterDataModel } from "./system/_module.mjs";
import DamageModifiersDataModel from "./system/damage-modifiers-data-model.mjs";
import AH from "../../config.mjs";

/**
 * @property {ParameterDataModel} def
 * @property {ParameterDataModel} mdef
 * @property {ParameterDataModel} init
 * @property {ParameterDataModel} block Bonus block generation as a percentage .
 * @property {DamageModifiersDataModel} damage
 * @property {CheckModifiersDataModel} check
 */
export class CharacterParametersDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      def: new EmbeddedDataField(ParameterDataModel, {}),
      mdef: new EmbeddedDataField(ParameterDataModel, {}),
      init: new EmbeddedDataField(ParameterDataModel, {}),

      block: new EmbeddedDataField(ParameterDataModel, {}),

      damage: new EmbeddedDataField(DamageModifiersDataModel, {}),
      check: new EmbeddedDataField(CheckModifiersDataModel, {}),
    });
  }

  /**
   * @returns {ModifierEntry[]}
   */
  summarizeModifiers() {
    let result = [];
    const mods = Modifiers.resolveFromModel(this);

    result.push({
      key: AH.defenses.def.long,
      additive: this.def.current,
      multiplicative: 1,
    });

    result.push({
      key: AH.defenses.mdef.long,
      additive: this.mdef.current,
      multiplicative: 1,
    });

    result.push({
      key: "AH.CHARACTER.PARAMETER.Initiative",
      additive: this.init.current,
      multiplicative: 1,
    });

    result.push({
      key: "AH.CHARACTER.PARAMETER.Block",
      additive: 0,
      multiplicative: 1 + (this.block.current / 100),
    });

    result.push(...Modifiers.resolveFromModel(this.damage));
    return result;
  }
}
