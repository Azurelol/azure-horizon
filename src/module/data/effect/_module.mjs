import * as Actions from "./actions/_module.mjs";
import * as Triggers from "./triggers/_module.mjs";
import * as Predicates from "./predicates/_module.mjs";

import ActiveEffectModel from "./active-effect-model.mjs";
import { default as RuleElementDataModel, RuleElementRegistry } from "./rule-element-data-model.mjs";

import { DataModelRegistry } from "../api/_module.mjs";

import { RuleTriggerDataModel } from "./rule-trigger-data-model.mjs";
import { RuleActionDataModel } from "./rule-action-data-model.mjs";
import { RulePredicateDataModel } from "./rule-predicate-data-model.mjs";
import { systemID } from "../../constants.mjs";

const dataModels = Object.freeze({
  base: ActiveEffectModel,
});

const ruleDataModels = [...Object.values(Actions), ...Object.values(Triggers), ...Object.values(Predicates)];

/**
 * @type {any[]} All the handlebar template partials used by rule elements.
 */
const templates = ruleDataModels.map(field => {
  return field.template;
});

/**
 * @description Registry of all {@linkcode RuleTriggerDataModel}
 */
class RuleTriggerRegistry extends DataModelRegistry {
  constructor() {
    super({
      kind: "Rule Trigger",
      baseClass: RuleTriggerDataModel,
    });

    for (const trigger of Object.values(Triggers)) {
      this.register(systemID, trigger.TYPE, trigger);
    }
  }

  static instance = new RuleTriggerRegistry();
}

/**
 * @description Registry of all {@linkcode RuleActionDataModel}
 */
class RuleActionRegistry extends DataModelRegistry {
  constructor() {
    super({
      kind: "Rule Action",
      baseClass: RuleActionDataModel,
    });

    for (const action of Object.values(Actions)) {
      this.register(systemID, action.TYPE, action);
    }
  }

  static instance = new RuleActionRegistry();
}

/**
 * @description Registry of all {@linkcode RuleElementDataModel}
 */
class RulePredicateRegistry extends DataModelRegistry {
  constructor() {
    super({
      kind: "Rule Predicate",
      baseClass: RulePredicateDataModel,
    });

    for (const predicate of Object.values(Predicates)) {
      this.register(systemID, predicate.TYPE, predicate);
    }
  }

  static instance = new RulePredicateRegistry();
}

/**
 *
 */
function registerDataModels() {

  // for (const predicate of Object.values(Predicates)) {
  //   RulePredicateRegistry.instance.register(systemID, predicate.TYPE, predicate);
  // }
  // for (const action of Object.values(Actions)) {
  //   RuleActionRegistry.instance.register(systemID, action.TYPE, action);
  // }
}

export
{
  ActiveEffectModel,
  dataModels,
  templates,
  registerDataModels,

  RuleElementDataModel,
  RuleElementRegistry,
  RuleTriggerRegistry,
  RulePredicateRegistry,
  RuleActionRegistry,
};
