import BaseCharacterDataModel, {
  CharacterParametersDataModel,
  CharacterResourcesDataModel,
} from "./base-character-data-model.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import EquipmentDataModel from "./system/equipment-data-model.mjs";
import { ResourceDataModel } from "./system/_module.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

/**
 * @typedef CharacterResources
 * @property {ResourceDataModel} hp
 * @property {ResourceDataModel} mp
 * @property {ResourceDataModel} ip
 */

/**
 * @typedef CharacterAttributes
 */

/**
 * @property {ParameterDataModel} def
 * @property {ParameterDataModel} mdef
 */
class HeroParametersDataModel extends CharacterParametersDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
    });
  }
}

/**
 * @property {ResourceDataModel} hp
 * @property {ResourceDataModel} mp
 * @property {ResourceDataModel} ip
 * @property {ResourceDataModel} tp
 */
class HeroResourcesDataModel extends CharacterResourcesDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      ip: new EmbeddedDataField(ResourceDataModel, {}),
      tp: new EmbeddedDataField(ResourceDataModel, {}),
    });
  }
}

/**
 * Represents the data of PC in combat.
 * @property {HeroResourcesDataModel} resources
 * @property {HeroParametersDataModel} parameters
 * @property {EquipmentDataModel} equipment
 */
export default class HeroDataModel extends BaseCharacterDataModel {

  /**
   * @type {Set<AH_ItemType>}
   */
  static ITEM_TYPES = new Set(["class", "skill", "armor", "weapon", "accessory", "consumable", "spell"]);

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      equipment: new EmbeddedDataField(EquipmentDataModel, {}),
      parameters: new EmbeddedDataField(HeroParametersDataModel, {}),
      resources: new EmbeddedDataField(HeroResourcesDataModel, {}),
    });
  }

  _prepareResources() {
    super._prepareResources();
    this.resources.ip.defineMaximumProperty(() => Formulas.calculateInventoryPoints());
    this.resources.tp.defineMaximumProperty(() => Formulas.calculateTensionPoints());
  }

  _prepareParameters() {
    super._prepareParameters();
  }

  supportsItemType(type) {
    return HeroDataModel.ITEM_TYPES.has(type);
  }

  /**
   * @typedef EquippedItems
   * @property {AHItem} mainHand
   * @property {AHItem} offHand
   * @property {AHItem} armor
   */

  /**
   * @returns {EquippedItems}
   */
  getEquippedItems() {
    const actor = this.parent;
    return {
      mainHand: actor.items.get(this.equipment.mainHand),
      offHand: actor.items.get(this.equipment.offHand),
      armor: actor.items.get(this.equipment.armor),
    };
  }

}
