import ActorDataModel from "./actor-data-model.mjs";
import { BaseEntityDataModel } from "./entity-data-model.mjs";
import { CharacterAttributesDataModel } from "./character-data-model.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

/**
 * @property {Number} level
 * @property {CharacterAttributesDataModel} attributes
 * @property {EntityResourcesDataModel} resources
 */
export default class UnitDataModel extends BaseEntityDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      attributes: new EmbeddedDataField(CharacterAttributesDataModel, {}),
    });
  }
}
