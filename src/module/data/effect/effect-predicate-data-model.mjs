import { DataModelRegistry, SubDocumentDataModel } from "../api/_module.mjs";
import { isActorType, systemID, systemTemplatePath } from "../../constants.mjs";

const fields = foundry.data.fields;

/**
 * @description Defines a predicate for an active effect.
 */
export class EffectPredicateDataModel extends SubDocumentDataModel {
  /** @inheritdoc */
  static get metadata() {
    return {
      ...super.metadata,
      documentName: "effectPredicate",
      icon: "fa-solid fa-check",
    };
  }

  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
  }

  /**
   * @return {String}
   */
  static get localization() {
    throw new Error("Not implemented");
  }

  /**
   * @return {String}
   */
  static get template() {
    throw new Error("Not implemented");
  }

  /**
   * @param {AHActor|AHItem} document
   * @returns {boolean}
   */
  validate(document) {
    return true;
  }
}

export class StatusEffectPredicateDataModel extends EffectPredicateDataModel {

  static {
    Object.defineProperty(this, "TYPE", { value: "statusEffectPredicate" });
  }

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      status: new fields.StringField({
        initial: "",
      }),
    });
  }

  static get template()
  {
    return systemTemplatePath("sheets/effect/predicates/status-effect-predicate");
  }

  static get localization() {
    return "AH.EFFECT.PREDICATES.Status";
  }

  validate(document) {
    if (isActorType(document)) {
      /** @type AHActor **/
      const actor = document;
    }
    return false;
  }
}

const PREDICATES = {
  status: StatusEffectPredicateDataModel,
};

/**
 * @description Registry of all {@linkcode RuleElementDataModel}
 */
export class EffectPredicateRegistry extends DataModelRegistry {
  constructor() {
    super({
      kind: "Effect Predicate",
      baseClass: EffectPredicateDataModel,
    });

    for (const predicate of Object.values(PREDICATES)) {
      this.register(systemID, predicate.TYPE, predicate);
    }
  }

  static instance = new EffectPredicateRegistry();
}
