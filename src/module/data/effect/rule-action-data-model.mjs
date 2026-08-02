import { DataModelRegistry, SubDocumentDataModel } from "../api/_module.mjs";

/**
 * @typedef RuleActionMetaData
 * @extends SubDocumentMetadata
 * @property {string[]} eventTypes
 */

/**
 * @description Executes an action given context information and selected targets.
 * @static metadata
 */
export default class RuleActionDataModel extends SubDocumentDataModel {
  /**
	 * @inheritdoc
	 * @returns RuleActionMetaData
	 * */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "ruleAction",
      icon: "fa-wrench",
    };
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
	 * @param {CharacterInfo[]} selected
	 * @returns {Promise<void>}
	 */
  async execute(context, selected) {
    throw new Error("Not implemented");
  }
}
