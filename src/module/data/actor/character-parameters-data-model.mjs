import { ExchangeModifiersDataModel, Modifiers, VersionedDataModel } from "../api/_module.mjs";
import { CheckModifiersDataModel, ParameterDataModel } from "./system/_module.mjs";
import DamageModifiersDataModel from "./system/damage-modifiers-data-model.mjs";
import AH from "../../config.mjs";
import { Formulas } from "../../ruleset/_module.mjs";

/**
 * @property {ParameterDataModel} def
 * @property {ParameterDataModel} mdef
 * @property {ParameterDataModel} init
 * @property {ParameterDataModel} block Bonus BLK generation. (As a percentage)
 * @property {ExchangeModifiersDataModel} recovery Bonus HP recovery.
 * @property {ParameterDataModel} movement How many spaces a character can shift.
 * @property {DamageModifiersDataModel} damage
 * @property {CheckModifiersDataModel} checks
 */
export class CharacterParametersDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      def: new EmbeddedDataField(ParameterDataModel, {}),
      mdef: new EmbeddedDataField(ParameterDataModel, {}),
      init: new EmbeddedDataField(ParameterDataModel, {}),

      block: new EmbeddedDataField(ParameterDataModel, {}),
      recovery: new EmbeddedDataField(ExchangeModifiersDataModel, {}),
      movement: new EmbeddedDataField(ParameterDataModel, {}),

      damage: new EmbeddedDataField(DamageModifiersDataModel, {}),
      checks: new EmbeddedDataField(CheckModifiersDataModel, {}),
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
      key: "AH.CHARACTER.PARAMETER.Proficiency",
      additive: this.parent.proficiency,
      multiplicative: 1,
    });

    result.push(...Modifiers.resolveFromModel(this.checks));

    // Block
    result.push({
      key: "AH.CHARACTER.PARAMETER.Block",
      additive: this.block.current,
      multiplicative: 1,
    });

    result.push(...Modifiers.resolveFromModel(this.damage));
    return result;
  }
}
