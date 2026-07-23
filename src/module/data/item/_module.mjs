import BaseItemDataModel from "./base-item-data-model.mjs";
import WeaponDataModel from "./weapon-data-model.mjs";
import SkillModel from "./skill-model.mjs";

const dataModels = Object.freeze({
  base: BaseItemDataModel,
  weapon: WeaponDataModel,
  skill: SkillModel,
});

export { dataModels };
