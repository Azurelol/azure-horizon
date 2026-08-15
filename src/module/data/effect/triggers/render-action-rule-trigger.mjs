import RuleTriggerDataModel from "../rule-trigger-data-model.mjs";
import AH from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import { TraitsField } from "../../item/fields/_module.mjs";
import { FoundryUtils } from "../../../utils/_module.mjs";

/**
 * @extends RuleTriggerDataModel
 * @property {String} identifier The id of an item to match.
 * @property {Set<CheckType>} checkTypes
 * @property {Set<AH_ItemGroup>} itemGroups
 * @property {Boolean} local Whether this RE only works for the item it's attached to.
 * @inheritDoc
 */
export default class RenderActionRuleTrigger extends RuleTriggerDataModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      eventType: AH.hooks.RENDER_ACTION_EVENT,
    };
  }

  static {
    Object.defineProperty(this, "TYPE", { value: "renderActionRuleTrigger" });
  }

  static defineSchema() {
    const { BooleanField, SchemaField, NumberField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      itemGroups: new TraitsField({
        options: FoundryUtils.getFormSelectOptions(AH.itemGroups),
      }),
      checkTypes: new TraitsField({
        options: FoundryUtils.getFormSelectOptions(AH.checkTypes),
      }),
      identifier: new StringField(),
      local: new BooleanField({ initial: true }),
    });
  }

  static get localization() {
    return "AH.RULE.TRIGGER.RenderAction";
  }

  static get template() {
    return systemTemplatePath("sheets/effect/rules/triggers/render-action-rule-trigger");
  }

  /**
	 * @param {RuleElementContext<RenderActionEvent>} context
	 * @returns {boolean}
	 */
  validateContext(context) {
    if (this.itemGroups.size > 0) {
      if (!this.itemGroups.has(context.event.itemGroup)) {
        return false;
      }
    }

    // Validate check types
    /** @type {CheckType} **/
    const checkType = context.event.config.check.type;
    if ((this.checkTypes.size > 0) && !this.checkTypes.has(checkType)) {
      return false;
    }

    // If this RE is on an item, and it doesn't match the item in the event.
    if (this.local) {
      if (!context.isLocalItem()) {
        return false;
      }
    }

    // Check identifier
    if (this.identifier) {
      if (!context.matchesItem(this.identifier)) {
        return false;
      }
    }
    return true;
  }
}
