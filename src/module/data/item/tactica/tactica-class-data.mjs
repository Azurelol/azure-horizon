import { systemTemplatePath } from "../../../constants.mjs";
import TacticaTypeDataModel from "../tactica-type-data-model.mjs";
import AH, { getFormSelectOptions } from "../../../config.mjs";
import TacticaWeaponData from "./tactica-weapon-data.mjs";
import { TraitsField } from "../fields/_module.mjs";

/**
 * @property {Set<AH_Tactica_UnitTrait>} traits
 * @property {Number} movement
 * @property {Number} tier
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
        label: "AH.TACTICA.Tier",
        _part: "header",
      }),
      movement: new NumberField({
        initial: AH.tactica.unit.movement.default,
        min: AH.tactica.unit.movement.min,
        max: AH.tactica.unit.movement.max,
        label: "AH.CHARACTER.Movement.long",
        _part: "header",
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
