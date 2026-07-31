import * as Actions from "./actions/_module.mjs";
import * as Triggers from "./triggers/_module.mjs";
import * as Predicates from "./predicates/_module.mjs";

import ActiveEffectModel from "./active-effect-model.mjs";
import { default as RuleElementDataModel } from "./rule-element-data-model.mjs";

import { DataModelRegistry } from "../api/_module.mjs";
import { RuleTriggerDataModel } from "./rule-trigger-data-model.mjs";
import { RuleActionDataModel } from "./rule-action-data-model.mjs";
import { RulePredicateDataModel } from "./rule-predicate-data-model.mjs";
import { systemID } from "../../constants.mjs";

const dataModels = Object.freeze({
  base: ActiveEffectModel,
});

const templates = [...Object.values(Actions), ...Object.values(Triggers), ...Object.values(Predicates)].map(field => {
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
  }

  static instance = new RulePredicateRegistry();
}

/**
 * @description Registry of all {@linkcode RuleElementDataModel}
 */
export class RuleElementRegistry extends DataModelRegistry {
  constructor() {
    super({
      kind: "Rule Element",
      baseClass: RuleElementDataModel,
    });
    this.register(systemID, RuleElementDataModel.TYPE, RuleElementDataModel);
  }

  static instance = new RuleElementRegistry();
}

export
{
  ActiveEffectModel,
  dataModels,
  templates,
  RuleElementDataModel,
  RuleTriggerRegistry,
  RulePredicateRegistry,
  RuleActionRegistry,
};
