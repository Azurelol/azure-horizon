import { systemID } from "../../constants.mjs";
import { DataModelRegistry } from "../api/_module.mjs";
import RuleTriggerDataModel from "./rule-trigger-data-model.mjs";

import * as Actions from "./actions/_module.mjs";
import * as Triggers from "./triggers/_module.mjs";
import * as Predicates from "./predicates/_module.mjs";

import RuleActionDataModel from "./rule-action-data-model.mjs";
import RulePredicateDataModel from "./rule-predicate-data-model.mjs";
import RuleElementDataModel from "./rule-element-data-model.mjs";

/**
 * @description Registry of all {@linkcode RuleTriggerDataModel}
 */
export class RuleTriggerRegistry extends DataModelRegistry {
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
export class RuleActionRegistry extends DataModelRegistry {
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
export class RulePredicateRegistry extends DataModelRegistry {
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
