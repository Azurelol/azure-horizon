import { DataModelRegistry, SubDocumentDataModel } from "../api/_module.mjs";
import { isActorType, resolveActor, systemID, systemTemplatePath } from "../../constants.mjs";
import { StringUtils } from "../../utils/_module.mjs";
import AH from "../../config.mjs";

const fields = foundry.data.fields;

const { SchemaField, StringField, HTMLField, NumberField, BooleanField, EmbeddedDataField } = foundry.data.fields;

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
  validateEffect(document) {
    throw new Error("Not implemented");
  }
}

/**
 * @property {AH_StatusEffect} effect
 * @property {Boolean} active Whether the effect needs to be active.
 */
export class StatusEffectPredicateDataModel extends EffectPredicateDataModel {

  static {
    Object.defineProperty(this, "TYPE", { value: "statusEffectPredicate" });
  }

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      effect: new StringField({
        initial: "",
      }),
      active: new BooleanField({ initial: true }),
    });
  }

  static get template()
  {
    return systemTemplatePath("sheets/effect/predicates/status-effect-predicate");
  }

  static get localization() {
    return "AH.EFFECT.PREDICATES.Status";
  }

  validateEffect(document) {
    if (isActorType(document)) {
      /** @type AHActor **/
      const actor = document;
      const instance = actor.resolveEffect(this.effect);

      // Check whether effect must be active
      const active = !!instance;
      if (this.active !== active) {
        return false;
      }
      // TODO: Other conditions on this predicate...

      return true;
    }
    return false;
  }
}

/**
 * @property {AH_Resource} resource
 * @property {AH_Threshold} threshold
 */
export class ResourceEffectPredicateDataModel extends EffectPredicateDataModel {

  static {
    Object.defineProperty(this, "TYPE", { value: "resourceEffectPredicate" });
  }

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      resource: new StringField({ initial: "hp", choices: () => AH.resourceTypes, blank: true, nullable: false }),
      threshold: new SchemaField({
        operator: new StringField({ initial: "greaterThan", choices: () => AH.comparisonOperator }),
        kind: new StringField({ initial: "absolute", choices: () => AH.numericKind }),
        amount: new NumberField({ initial: 0, integer: false }),
      }),
    });
  }

  static get template()
  {
    return systemTemplatePath("sheets/effect/predicates/resource-effect-predicate");
  }

  static get localization() {
    return "AH.EFFECT.PREDICATES.Resource";
  }

  validateEffect(document) {
    const actor = resolveActor(document);
    if (actor) {
      /** @type ActorResourceDataModel **/
      const resource = actor.system.resources[this.resource];
      if (resource) {
        if (this.threshold.operator) {
          if (Number.isInteger(resource.value)) {
            switch (this.threshold.operator) {
              case "greaterThan":
                if (this.threshold.kind === "absolute") {
                  if (resource.value >= this.threshold.amount) {
                    return true;
                  }
                }
                else {
                  if (resource.percent >= this.threshold.amount) {
                    return true;
                  }
                }
                break;

              case "lessThan":
                if (this.threshold.kind === "absolute") {
                  if (resource.value <= this.threshold.amount) {
                    return true;
                  }
                }
                else {
                  if (resource.percent <= this.threshold.amount) {
                    return true;
                  }
                }
                break;
            }
            return false;
          } else {
            console.warn("The given amount in the event was not an integer.");
          }
        }
        return true;
      }

    }
    return false;
  }
}

const PREDICATES = {
  status: StatusEffectPredicateDataModel,
  resource: ResourceEffectPredicateDataModel,
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
