import { DataModelRegistry, SubDocumentDataModel } from "../api/_module.mjs";
import AH from "../../config.mjs";

const fields = foundry.data.fields;

/**
 * @description Defines the trigger for a rule element.
 * @property {AH_TargetSelector} selector
 * @property {AH_EventRelationKey} eventRelation
 * @property {RulePredicateDataModel[] | TypedCollectionField} predicates
 */
export class RuleTriggerDataModel extends SubDocumentDataModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "ruleTrigger",
      icon: "fa-solid fa-check",
      eventType: "",
    };
  }

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      eventRelation: new fields.StringField({
        initial: "",
        blank: true,
        choices: Object.keys(AH.eventRelation),
      }),
    });
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
    return false;
  }

  /**
	 * @param {RuleElementContext} context
	 * @returns {boolean}
	 */
  preValidateContext(context) {
    switch (this.eventRelation) {
      case "source":
        if (context.source?.actor !== context.character?.actor) {
          return false;
        }
        break;

      case "target":
        if (context.targets.find((t) => t.actor === context.character.actor) === undefined) {
          return false;
        }
        break;
    }
    if (this.constructor.metadata.eventType !== context.type) {
      return false;
    }
    return true;
  }

  /**
	 * @param {RuleElementContext} context
	 * @returns {Boolean}
	 */
  evaluate(context) {
    if (!this.preValidateContext(context)) {
      return false;
    }
    return this.validateContext(context);
  }
}
