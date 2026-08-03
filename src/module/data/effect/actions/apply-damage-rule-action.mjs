import AH from "../../../config.mjs";
import { TraitsDataModel } from "../../item/fields/_module.mjs";
import { EvaluationContext } from "../../common/_module.mjs";
import { Damage, DamageData, DamageRequest, Expressions } from "../../../pipelines/_module.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import { FoundryUtils } from "../../../utils/_module.mjs";
import RuleActionDataModel from "../rule-action-data-model.mjs";

const fields = foundry.data.fields;

/**
 * @property {String} amount
 * @property {AH_DamageType} damageType
 * @property {TraitsDataModel} traits
 */
export default class ApplyDamageRuleAction extends RuleActionDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "applyDamageRuleAction" });
  }

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      amount: new fields.StringField({ blank: true }),
      damageType: new fields.StringField({
        initial: "untyped",
        choices: Object.keys(AH.damageTypes),
        blank: true,
        nullable: false,
      }),
      traits: new fields.EmbeddedDataField(TraitsDataModel, {
        options: FoundryUtils.getFormSelectOptions(AH.traits.damage),
      }),
    });
  }

  static get localization() {
    return "AH.RULE.ApplyDamage";
  }

  static get template() {
    return systemTemplatePath("sheets/effect/rules/actions/apply-damage-rule-action");
  }

  async execute(context, selected) {
    const targets = selected.map((t) => t.actor);
    const expressionContext = EvaluationContext.fromSourceInfo(context.sourceInfo, targets).withCheck(context.check);
    const evalAmount = await Expressions.evaluateAsync(this.amount, expressionContext);

    if (context.config) {
      if (context.check) {
        const _traits = this.traits.values;
        context.config.addTraits(_traits);
        switch (context.check.type) {
          case "action":
            context.config.modifyDamage(dmg => {
              dmg.add(context.label, this.damageType, evalAmount);
            });
            break;
        }
      }
    } else {
      const damageData = DamageData.construct(this.damageType, evalAmount);
      const request = new DamageRequest(context.sourceInfo, targets, damageData);
      if (!this.traits.empty) {
        request.addTraits(this.traits.values);
      }
      request.fromOrigin(context.origin);
      await Damage.promptApply(request);
    }
  }
}
