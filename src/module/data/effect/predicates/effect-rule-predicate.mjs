import { RulePredicateDataModel } from "../rule-predicate-data-model.mjs";
import AH from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";

const fields = foundry.data.fields;

/**
 * @property {AH_StatusEffect} effect *
 * @property {AH_TargetSelector} selector
 * @property {AH_PredicateQuantifier} quantifier
 */
export default class EffectRulePredicate extends RulePredicateDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "targetEffectRulePredicate" });
  }

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      selector: new fields.StringField({
        initial: "initial",
        blank: true,
        choices: Object.keys(AH.targetSelector),
      }),
      quantifier: new fields.StringField({
        initial: "any",
        blank: true,
        choices: Object.keys(AH.predicateQuantifier),
      }),
      effect: new fields.StringField({
        initial: "",
      }),
    });
  }

  static get localization() {
    return "AH.RULE.PredicateEffect";
  }

  static get template() {
    return systemTemplatePath("sheets/effect/rules/predicates/effect-rule-predicate");
  }

  validateContext(context) {
    const selected = context.selectTargets(this.selector);
    switch (this.quantifier) {
      case "all":
        // All selected actors must have the effect
        return selected.every((character) => character.actor.resolveEffect(this.effect));

      case "any":
        // At least one actor must have the effect
        return selected.some((character) => character.actor.resolveEffect(this.effect));

      case "none":
        // No actor should have the effect
        return selected.every((character) => !character.actor.resolveEffect(this.effect));
    }
    return false;
  }
}
