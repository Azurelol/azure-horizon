import CharacterDataModel, { CharacterAttributesDataModel, CharacterResourcesDataModel } from "./character-data-model.mjs";

import { CharacterParametersDataModel } from "./system/character-parameters-data-model.mjs";
import { ActorResourceDataModel } from "./system/_module.mjs";
import CharacterEquipmentDataModel from "./system/character-equipment-data-model.mjs";

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
 * @property {String} weapon
 */
class UnitEquipmentDataModel extends CharacterEquipmentDataModel {
  static defineSchema() {
    const { StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      weapon: new StringField({ nullable: true }),
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
      equipment: new EmbeddedDataField(UnitEquipmentDataModel, {}),
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
