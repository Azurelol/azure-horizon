import CheckDataModel from "./check-data-model.mjs";
import DamageDataModel from "./damage-data-model.mjs";
import ResourceDataModel from "./resource-data-model.mjs";
import TraitsDataModel from "./traits-data-model.mjs";

const dataModels = Object.freeze({
  check: CheckDataModel,
  damage: DamageDataModel,
  resource: ResourceDataModel,
  traits: TraitsDataModel,
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
  TraitsDataModel,
  CheckDataModel,
};
