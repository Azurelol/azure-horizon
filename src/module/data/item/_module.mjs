import ItemDataModel from "./item-data-model.mjs";
import AttackDataModel from "./attack-data-model.mjs";
import WeaponDataModel from "./weapon-data-model.mjs";
import SkillDataModel from "./skill-data-model.mjs";
import SpellDataModel from "./spell-data-model.mjs";
import ClassDataModel from "./class-data-model.mjs";
import ConsumableDataModel from "./consumable-data-model.mjs";

import * as fields from "./fields/_module.mjs";
import ArmorDataModel from "./armor-data-model.mjs";
import AccessoryDataModel from "./accessory-data-model.mjs";
import ClassFeatureDataModel from "./class-feature-data-model.mjs";
import AbilityDataModel from "./ability-data-model.mjs";

const dataModels = Object.freeze({
  base: ItemDataModel,

  attack: AttackDataModel,
  ability: AbilityDataModel,

  class: ClassDataModel,
  skill: SkillDataModel,
  classFeature: ClassFeatureDataModel,
  spell: SpellDataModel,

  weapon: WeaponDataModel,
  armor: ArmorDataModel,
  accessory: AccessoryDataModel,
  consumable: ConsumableDataModel,

});

export { dataModels, fields };
