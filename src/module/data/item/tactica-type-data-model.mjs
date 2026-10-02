import { SubDocumentDataModel } from "../api/_module.mjs";

/**
 * An implementation of a tactica item feature.
 */
export default class TacticaTypeDataModel extends SubDocumentDataModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "tacticaData",
      icon: "fa-solid fa-check",
    };
  }

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
    });
  }
}
