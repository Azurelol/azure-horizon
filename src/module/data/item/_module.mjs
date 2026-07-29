import BaseItemDataModel from "./base-item-data-model.mjs";
import WeaponDataModel from "./weapon-data-model.mjs";
import SkillDataModel from "./skill-data-model.mjs";

import * as fields from "./fields/_module.mjs";

const dataModels = Object.freeze({
  base: BaseItemDataModel,
  weapon: WeaponDataModel,
  skill: SkillDataModel,
});

export { dataModels, fields };
