import CheckDataModel from "./check-data-model.mjs";
export { default as CheckDataModel } from "./check-data-model.mjs";

const dataModels = Object.freeze({
  check: CheckDataModel,
});

/**
 * @type {String[]} The partial templates used by the data models.
 */
const templates = Object.values(dataModels).map(field => {
  return field.template;
});

export { dataModels, templates };
