import { systemTemplatePath } from "../../../constants.mjs";
import TacticaTypeDataModel from "../tactica-type-data-model.mjs";
import AH from "../../../config.mjs";

export default class TacticaWeaponData extends TacticaTypeDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "tacticaWeaponData" });
  }

  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      category: new StringField({
        initial: "sword",
        _part: "header",
        label: "AH.FIELD.Category",
        choices: () => AH.tactica.unit.weapon,
      }),
    });
  }

  /**
   * @return {String}
   */
  static get localization() {
    return "AH.UNIT.Weapon";
  }

  /**
   * @return {String}
   */
  static get template() {
    return systemTemplatePath("sheets/item/tactica/tactica-weapon-data");
  }
}
