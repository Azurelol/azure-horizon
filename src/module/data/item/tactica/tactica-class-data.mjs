import { systemTemplatePath } from "../../../constants.mjs";
import TacticaTypeDataModel from "../tactica-type-data-model.mjs";

export default class TacticaClassData extends TacticaTypeDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "tacticaClassData" });
  }

  /**
   * @return {String}
   */
  static get localization() {
    return "AH.UNIT.Class";
  }

  /**
   * @return {String}
   */
  static get template() {
    return systemTemplatePath("sheets/item/tactica/tactica-class-data");
  }
}
