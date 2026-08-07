import * as Actions from "./actions/_module.mjs";
import * as Triggers from "./triggers/_module.mjs";
import * as Predicates from "./predicates/_module.mjs";

import ActiveEffectModel from "./active-effect-model.mjs";

import { default as RuleElementDataModel } from "./rule-element-data-model.mjs";
import RuleTriggerDataModel from "./rule-trigger-data-model.mjs";
import RuleActionDataModel from "./rule-action-data-model.mjs";
import RulePredicateDataModel from "./rule-predicate-data-model.mjs";

import * as Registries from "./rule-data-model-registries.mjs";
import statusEffects from "./status-effects.mjs";

const dataModels = Object.freeze({
  base: ActiveEffectModel,
});

const ruleDataModels = [RuleElementDataModel, ...Object.values(Actions), ...Object.values(Triggers), ...Object.values(Predicates)];

/**
 * @type {any[]} All the handlebar template partials used by rule elements.
 */
const templates = ruleDataModels.map(field => {
  return field.template;
});

export
{
  ActiveEffectModel,
  dataModels,
  templates,
  statusEffects,

  Actions,
  Triggers,
  Predicates,
  Registries,

  RuleElementDataModel,
  RuleTriggerDataModel,
  RuleActionDataModel,
  RulePredicateDataModel,
};
