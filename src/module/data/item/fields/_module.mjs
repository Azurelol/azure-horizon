import CheckDataModel from "./check-data-model.mjs";
import DamageDataModel from "./damage-data-model.mjs";
import ResourceDataModel from "./resource-data-model.mjs";
import TraitsField from "./traits-field.mjs";
import ClassBenefitsDataModel from "./class-benefits-data-model.mjs";
import WeaponUsageDataModel from "./weapon-usage-data-model.mjs";
import { EffectsDataModel } from "./effects-data-model.mjs";
import { ActionCostDataModel } from "./action-cost-data-model.mjs";
import { ActionDataModel } from "./action-data-model.mjs";
import { ActionAttributesDataModel } from "./action-attributes-data-model.mjs";

const dataModels = Object.freeze({
  attributes: ActionAttributesDataModel,
  check: CheckDataModel,
  damage: DamageDataModel,
  resource: ResourceDataModel,
  effects: EffectsDataModel,
  traits: TraitsField,
  benefits: ClassBenefitsDataModel,
  advancement: WeaponUsageDataModel,
  action: ActionDataModel,
  cost: ActionCostDataModel,
});

/**
 * @type {String[]} The partial templates used by the data models.
 */
const templates = Object.values(dataModels).map(field => {
  return field.template;
});

export {
  dataModels,
  templates,

  DamageDataModel,
  ResourceDataModel,
  TraitsField,
  CheckDataModel,
};
