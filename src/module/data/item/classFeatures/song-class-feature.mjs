import { systemTemplatePath } from "../../../constants.mjs";
import ClassFeatureTypeDataModel from "../class-feature-type-data-model.mjs";

/**
 * @desc Initial rule trigger.
 */
export default class SongClassFeature extends ClassFeatureTypeDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "songClassFeature" });
  }

  /**
   * @return {String}
   */
  static get localization() {
    return "AH.CLASS.FEATURE.Song";
  }

  /**
   * @return {String}
   */
  static get template() {
    return systemTemplatePath("sheets/item/features/song-class-feature");
  }
}
