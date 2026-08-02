import { SubDocumentDataModel } from "../api/_module.mjs";

/**
 * @description Defines the trigger for a rule element.
 */
export default class RulePredicateDataModel extends SubDocumentDataModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "rulePredicate",
      icon: "fa-solid fa-check",
    };
  }

  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
  }

  static migrateData(source) {
    return super.migrateData(source);
  }

  /**
	 * @return {String}
	 */
  static get localization() {
    throw new Error("Not implemented");
  }

  /**
	 * @return {String}
	 */
  static get template() {
    throw new Error("Not implemented");
  }

  /**
	 * @param {RuleElementContext} context
	 * @returns {Boolean}
	 */
  validateContext(context) {
    throw new Error("Not implemented");
  }
}
