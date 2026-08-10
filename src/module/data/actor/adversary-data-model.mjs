import CharacterDataModel, {
  CharacterResourcesDataModel,
} from "./character-data-model.mjs";
import { CharacterParametersDataModel } from "./character-parameters-data-model.mjs";
import { CharacterResourceDataModel } from "./system/_module.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

/**
 * @property {CharacterResourceDataModel} hp
 * @property {CharacterResourceDataModel} mp
 */
class AdversaryResourcesDataModel extends CharacterResourcesDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      ip: new EmbeddedDataField(CharacterResourceDataModel, {}),
      tp: new EmbeddedDataField(CharacterResourceDataModel, {}),
    });
  }
}

/**
 * Represents the data of an adversary in combat.
 */
export default class AdversaryDataModel extends CharacterDataModel {

  /**
   * @type {Set<AH_ItemType>}
   */
  static ITEM_TYPES = new Set(["attack"]);

  static defineSchema() {
    const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      parameters: new EmbeddedDataField(CharacterParametersDataModel, {}),
      resources: new EmbeddedDataField(AdversaryResourcesDataModel, {}),
    });
  }

  supportsItemType(type) {
    return AdversaryDataModel.ITEM_TYPES.has(type);
  }
}
