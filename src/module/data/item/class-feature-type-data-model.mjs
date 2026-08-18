import { SubDocumentDataModel } from "../api/_module.mjs";

/**
 * An implementation of a class feature.
 */
export default class ClassFeatureTypeDataModel extends SubDocumentDataModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "classFeature",
      icon: "fa-solid fa-check",
    };
  }

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
    });
  }
}
