import { systemTemplatePath } from "../../../constants.mjs";
import TacticaTypeDataModel from "../tactica-type-data-model.mjs";
import AH, { getFormSelectOptions } from "../../../config.mjs";
import { TraitsField } from "../fields/_module.mjs";

/**
 * @property {AH_Tactica_Weapon} category
 * @property {Number} range
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
      range: new NumberField({
        initial: 1,
        _part: "header",
        label: "AH.TACTICA.Range",
      }),
      speed: new StringField({
        initial: "",
        label: "AH.TACTICA.Speed",
        blank: true,
        _part: "header",
        choices: () => AH.tactica.speed,
      }),
      damage: new SchemaField({
        amount: new StringField({ initial: "", integer: true, nullable: false }),
        type: new StringField({ initial: "untyped",
          choices: Object.keys(AH.damageTypes),
          nullable: false }),
      }),
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        _part: "header",
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
   * @return {String}
   */
  static get template() {
    return systemTemplatePath("sheets/item/tactica/tactica-weapon-data");
  }
}
