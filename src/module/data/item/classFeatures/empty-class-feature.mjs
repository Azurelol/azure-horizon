import { systemTemplatePath } from "../../../constants.mjs";
import ClassFeatureTypeDataModel from "../class-feature-type-data-model.mjs";

/**
 * @desc Initial rule trigger.
 */
export default class EmptyClassFeature extends ClassFeatureTypeDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "emptyClassFeature" });
  }

  /**
   * @return {String}
   */
  static get localization() {
    return "-";
  }

  /**
   * @return {String}
   */
  static get template() {
    return systemTemplatePath("components/empty");
  }
}
