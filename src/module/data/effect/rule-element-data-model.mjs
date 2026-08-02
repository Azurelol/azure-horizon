import { SubDocumentCollectionField, SubDocumentDataModel } from "../api/_module.mjs";
import { systemTemplatePath } from "../../constants.mjs";
import { EmptyRuleTrigger } from "./triggers/_module.mjs";
import AH from "../../config.mjs";
import { FoundryUtils, StringUtils } from "../../utils/_module.mjs";
import { Dialogs } from "../../helpers/_module.mjs";
import RuleActionDataModel from "./rule-action-data-model.mjs";
import RulePredicateDataModel from "./rule-predicate-data-model.mjs";

const fields = foundry.data.fields;

/**
 * @description A modular automation component for use in active effects
 * @property {RuleTriggerDataModel} trigger
 * @property {SubDocumentCollectionField, RuleActionDataModel[]} actions
 * @property {RulePredicateDataModel[]} predicates
 * @property {AH_TargetSelector} selector
 * @property {Boolean} enabled
 */
export default class RuleElementDataModel extends SubDocumentDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "ruleElement" });
  }

  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "ruleElement",
      icon: "fa-solid fa-circle-nodes",
      embedded: {
        ruleTrigger: "trigger",
        ruleAction: "actions",
        rulePredicate: "predicates",
      },
    };
  }

  static get template() {
    return systemTemplatePath("sheets/effect/rule-element");
  }

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      trigger: new fields.TypedSchemaField(AH.dataModelRegistries.ruleTrigger.types, {
        initial: new EmptyRuleTrigger(),
      }),
      actions: new SubDocumentCollectionField(RuleActionDataModel),
      predicates: new SubDocumentCollectionField(RulePredicateDataModel),
      selector: new fields.StringField({ initial: "initial", choices: Object.keys(AH.targetSelector) }),
      enabled: new fields.BooleanField({ initial: true }),
    });
  }

  /**
	 * @param {String} type
	 */
  async changeRuleTrigger(type) {
    if (type === this.trigger.type) {
      return;
    }
    const model = AH.dataModelRegistries.ruleTrigger.types[type];
    const newTrigger = new model();
    await this.update({ "==trigger": newTrigger });
  }

  /**
	 * @returns {Promise<void>}
	 */
  async addRuleAction() {
    let subTypes = this.getMatchingSubTypes(AH.dataModelRegistries.ruleAction);
    const options = FoundryUtils.getFormSelectOptions(subTypes, "long");
    const type = await Dialogs.select(
      StringUtils.localize("AH.COMMON.Add", {
        element: StringUtils.localize("AH.RULE.Action.plural"),
      }),
      options,
    );
    if (type) {
      await SubDocumentCollectionField.addModel(this.actions, type, this);
    }
  }

  /**
	 * @param {String} id The id of the action
	 * @returns {Promise<void>}
	 */
  async removeRuleAction(id) {
    const action = this.getAction(id);
    if (action) {
      await action.delete();
    }
  }

  /**
	 * @param {String} id
	 * @returns {RuleActionDataModel}
	 */
  getAction(id) {
    return this.actions.get(id);
  }

  /**
	 * @param {String} id
	 * @returns {RulePredicateDataModel}
	 */
  getPredicate(id) {
    return this.predicates.get(id);
  }

  /**
	 * @returns {Promise<void>}
	 */
  async addRulePredicate() {
    let subTypes = this.getMatchingSubTypes(AH.dataModelRegistries.rulePredicate);
    const options = FoundryUtils.getFormSelectOptions(subTypes);
    const type = await Dialogs.select(
      StringUtils.localize("AH.COMMON.Add", {
        element: StringUtils.localize("FU.RULE.Predicate.plural"),
      }),
      options,
    );
    if (type) {
      await SubDocumentCollectionField.addModel(this.predicates, type, this);
    }
  }

  /**
	 * @param {String} id The id of the action
	 * @returns {Promise<void>}
	 */
  async removeRulePredicate(id) {
    const predicate = this.predicates.get(id);
    if (predicate) {
      await predicate.delete();
    }
  }

  /**
	 * @param {DataModelRegistry} registry
	 * @returns {Record<string, string>}
	 */
  getMatchingSubTypes(registry) {
    let subTypes = registry.localizedEntries;
    const triggerEventType = this.trigger.schema.model.metadata.eventType;
    if (triggerEventType) {
      subTypes = Object.fromEntries(
        Object.entries(subTypes).filter(([key, value]) => {
          const model = registry.types[key];
          /** @type RuleActionMetaData **/
          const modelMetaData = model.metadata;
          if (modelMetaData.eventTypes) {
            if (modelMetaData.eventTypes.find((t) => t === triggerEventType) === undefined) {
              return false;
            }
          }
          return true;
        }),
      );
    }
    return subTypes;
  }

  /**
	 * @param {RuleElementContext} context
	 * @returns {Boolean} True if the element was executed.
	 */
  async evaluate(context) {
    // 0. Enabled
    if (!this.enabled) {
      return false;
    }
    // 1. Evaluate the attached trigger
    const valid = this.trigger.evaluate(context);
    if (!valid) {
      return false;
    }
    // 2. Optional filtering based on variable predicates
    for (const predicate of this.predicates) {
      if (!predicate.validateContext(context)) {
        return false;
      }
    }
    // 3. Select what characters to execute the actions on
    const selected = context.selectTargets(this.selector);
    // 4. Execute the actions on all selected characters
    for (const action of this.actions) {
      await action.execute(context, selected);
    }
    return true;
  }

  /**
	 * @description Adds to a rendering context
	 * @param {Object} context
	 * @returns {Promise<void>}
	 */
  async prepareRenderContext(context) {
    for (const action of this.actions) {
      await action.prepareRenderContext(context);
    }
  }

  /**
	 * @returns {String}
	 * @remarks Used by handlebars templates.
	 */
  get templateHeader() {
    return StringUtils.localize(this.trigger.schema.model.localization);
  }
}
