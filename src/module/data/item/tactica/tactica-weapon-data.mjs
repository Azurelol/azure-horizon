import { systemTemplatePath } from "../../../constants.mjs";
import TacticaTypeDataModel from "../tactica-type-data-model.mjs";

export default class TacticaWeaponData extends TacticaTypeDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "tacticaWeaponData" });
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
