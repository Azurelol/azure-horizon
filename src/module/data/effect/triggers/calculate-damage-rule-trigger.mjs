import { RuleTriggerDataModel } from "../rule-trigger-data-model.mjs";
import AH from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";

const fields = foundry.data.fields;

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
    const schema = Object.assign(super.defineSchema(), {
      itemGroups: new fields.SetField(new fields.StringField()),
      damageTypes: new fields.SetField(new fields.StringField()),
      identifier: new fields.StringField(),
      local: new fields.BooleanField(),
    });
    return schema;
  }

  static migrateData(source) {
    return super.migrateData(source);
  }

  static get localization() {
    return "AH.RULE.CalculateDamage";
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
