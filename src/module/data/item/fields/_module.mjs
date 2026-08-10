import CheckDataModel from "./check-data-model.mjs";
import DamageDataModel from "./damage-data-model.mjs";
import ResourceDataModel from "./resource-data-model.mjs";
import TraitsField from "./traits-field.mjs";
import ClassBenefitsDataModel from "./class-benefits-data-model.mjs";
import SkillAdvancementDataModel from "./skill-advancement-data-model.mjs";
import { EffectsDataModel } from "./effects-data-model.mjs";
import { ActionCostDataModel } from "./action-cost-data-model.mjs";

const dataModels = Object.freeze({
  check: CheckDataModel,
  damage: DamageDataModel,
  resource: ResourceDataModel,
  effects: EffectsDataModel,
  traits: TraitsField,
  benefits: ClassBenefitsDataModel,
  advancement: SkillAdvancementDataModel,
  actionCost: ActionCostDataModel,
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
