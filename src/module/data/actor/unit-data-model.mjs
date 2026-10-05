import ActorDataModel from "./actor-data-model.mjs";
import { BaseEntityDataModel } from "./entity-data-model.mjs";
import CharacterDataModel, { CharacterAttributesDataModel, CharacterResourcesDataModel } from "./character-data-model.mjs";
import InventoryDataModel from "./system/inventory-data-model.mjs";
import { ActorResourceDataModel } from "./system/_module.mjs";
import { CharacterParametersDataModel } from "./character-parameters-data-model.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

/**
 * @property {ActorResourceDataModel} hp
 * @property {ActorResourceDataModel} ip
 */
class UnitResourcesDataModel extends CharacterResourcesDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      ip: new EmbeddedDataField(ActorResourceDataModel, {}),
    });
  }
}

/**
 * @property {ParameterDataModel} def
 * @property {ParameterDataModel} mdef
 * @property {HeroOverrideData} overrides
 */
class UnitParametersDataModel extends CharacterParametersDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
    });
  }
}

/**
 * @property {Number} level
 * @property {CharacterAttributesDataModel} attributes
 * @property {EntityResourcesDataModel} resources
 */
export default class UnitDataModel extends CharacterDataModel {

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      equipment: new EmbeddedDataField(InventoryDataModel, {}),
      resources: new EmbeddedDataField(UnitResourcesDataModel, {}),
      parameters: new EmbeddedDataField(UnitParametersDataModel, {}),
    });
  }

  /**
   * @type {Set<AH_ItemType>}
   */
  static ITEM_TYPES = new Set(["tactica"]);

  supportsItemType(type) {
    return UnitDataModel.ITEM_TYPES.has(type);
  }

}
