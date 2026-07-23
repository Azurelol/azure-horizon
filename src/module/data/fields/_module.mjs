import { systemTemplatePath } from "../../constants.mjs";
export { default as CheckDataModel } from "./check-data-model.mjs";

const templates = Object.freeze({
  check: systemTemplatePath("sheets/item/partials"),
});

export { templates };
