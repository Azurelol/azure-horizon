import AH from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import RuleTriggerDataModel from "../rule-trigger-data-model.mjs";
import { TraitsField } from "../../item/fields/_module.mjs";
import { FoundryUtils } from "../../../utils/_module.mjs";

/**
 * @description Trigger based on a {@linkcode CalculateDamageEvent}
 * @extends RuleTriggerDataModel
 * @property {Set<AH_ItemGroup>} itemGroups
 * @property {Set<AH_DamageType>} damageTypes
 * @property {String} identifier
 * @property {Boolean} local
 * @inheritDoc
 */
export default class CalculateDamageRuleTrigger extends RuleTriggerDataModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      eventType: AH.hooks.CALCULATE_DAMAGE_EVENT,
    };
  }

  static {
    Object.defineProperty(this, "TYPE", { value: "calculateDamageRuleTrigger" });
  }

  static defineSchema() {
    const { BooleanField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      itemGroups: new TraitsField({
        options: FoundryUtils.getFormSelectOptions(AH.itemGroups),
      }),
      damageTypes: new TraitsField({
        options: FoundryUtils.getFormSelectOptions(AH.damageTypes),
      }),
      identifier: new StringField(),
      local: new BooleanField(),
    });
  }

  static migrateData(source) {
    return super.migrateData(source);
  }

  static get localization() {
    return "AH.RULE.TRIGGER.CalculateDamage";
  }

  static get template() {
    return systemTemplatePath("sheets/effect/rules/triggers/calculate-damage-rule-trigger");
  }

  /**
	 * @param {RuleElementContext<CalculateDamageEvent>} context
	 * @returns {boolean}
	 */
  validateContext(context) {
    if ((this.itemGroups.size > 0) && (!this.itemGroups.has(context.event.itemGroup))) {
      return false;
    }
    if ((this.damageTypes.size > 0) && !this.damageTypes.has(context.event.type)) {
      return false;
    }
    if (this.identifier) {
      if (!context.matchesItem(this.identifier)) {
        return false;
      }
    }
    if (this.local) {
      if (!context.isLocalItem()) {
        return false;
      }
    }
    return true;
  }
}
