import { systemTemplatePath } from "../../../constants.mjs";
import TacticaTypeDataModel from "../tactica-type-data-model.mjs";
import AH, { getFormSelectOptions } from "../../../config.mjs";
import { TraitsField } from "../fields/_module.mjs";
import { EffectsDataModel } from "../fields/effects-data-model.mjs";

/**
 * @property {AH_Tactica_Weapon} category
 * @property {Number} range.min
 * @property {Number} range.max
 * @property {Number} weight
 * @property {AH_Tactica_DamageType} damage.type
 */
export default class TacticaWeaponData extends TacticaTypeDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "tacticaWeaponData" });
  }

  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      category: new StringField({
        initial: "sword",
        _part: "header",
        label: "AH.FIELD.Category",
        choices: () => AH.tactica.weapon.category,
      }),
      range: new SchemaField({
        min: new NumberField({
          initial: 1,
          _part: "header",
          _classes: "ah-flex-shrink",
          label: "AH.TACTICA.RANGE.Minimum",
        }),
        max: new NumberField({
          initial: 1,
          _part: "header",
          _classes: "ah-flex-shrink",
          label: "AH.TACTICA.RANGE.Maximum",
        }),
      }),
      weight: new StringField({
        initial: "light",
        _part: "header",
        label: "AH.FIELD.Weight",
        choices: () => AH.equipmentWeight,
      }),
      damage: new SchemaField({
        type: new StringField({
          initial: "",
          choices: () => AH.tactica.damage,
          nullable: false,
          blank: true,
          label: "AH.FIELD.DamageType.long",
          _part: "properties",
        }),
        power: new StringField({
          initial: "low",
          label: "AH.FIELD.Power",
          choices: Object.keys(AH.power),
          formOptions: getFormSelectOptions(AH.power),
          nullable: false,
          _part: "properties" }),
      }),
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        _part: "properties",
        formOptions: getFormSelectOptions(AH.tactica.weapon.traits),
      }),
    });
  }

  /**
   * @return {String}
   */
  static get localization() {
    return "AH.TACTICA.Weapon";
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {

  }

  /**
   * @return {String}
   */
  static get template() {
    return systemTemplatePath("sheets/item/tactica/tactica-weapon-data");
  }
}
