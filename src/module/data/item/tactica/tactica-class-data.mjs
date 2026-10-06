import { systemTemplatePath } from "../../../constants.mjs";
import TacticaTypeDataModel from "../tactica-type-data-model.mjs";
import AH, { getFormSelectOptions } from "../../../config.mjs";
import TacticaWeaponData from "./tactica-weapon-data.mjs";
import { TraitsField } from "../fields/_module.mjs";

/**
 * @typedef TacticaClassBenefits
 * @property def
 * @property mdef
 * @property mov
 * @property init
 */

/**
 * @property {Number} tier
 * @property {Set<AH_Tactica_UnitTrait>} traits
 * @property {TacticaClassBenefits} benefits
 */
export default class TacticaClassData extends TacticaTypeDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "tacticaClass" });
  }

  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      tier: new NumberField({
        initial: AH.tactica.unit.tier.default,
        min: AH.tactica.unit.tier.min,
        max: AH.tactica.unit.tier.max,
        step: 1,
        label: "AH.TACTICA.Tier",
        _part: "header",
      }),
      benefits: new SchemaField({
        mov: new NumberField({ initial: 0, label: "AH.CHARACTER.Movement.long" }),
        def: new NumberField({ initial: 0, label: "AH.CHARACTER.Defense.long" }),
        mdef: new NumberField({ initial: 0, label: "AH.CHARACTER.MagicDefense.long" }),
        init: new NumberField({ initial: 0, label: "AH.CHARACTER.Initiative.long" }),
      }),
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        _part: "header",
        formOptions: getFormSelectOptions(AH.tactica.unit.traits),
      }),
    });
  }

  /**
   * @return {String}
   */
  static get localization() {
    return "AH.TACTICA.Class";
  }

  /**
   * @return {String}
   */
  static get template() {
    return systemTemplatePath("sheets/item/tactica/tactica-class-data");
  }
}
