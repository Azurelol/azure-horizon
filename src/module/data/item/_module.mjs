import BaseItemModel from "./base-item-model.mjs";
import WeaponModel from "./weapon-model.mjs";
import SkillModel from "./skill-model.mjs";


const dataModels = Object.freeze({
  base: BaseItemModel,
  weapon: WeaponModel,
  skill: SkillModel
});

export { dataModels };
