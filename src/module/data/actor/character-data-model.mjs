import BaseCharacterDataModel from "./base-character-data-model.mjs";
import { ResourceDataModel } from "../api/resource-data-model.mjs";

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
 * Represents a PC in the tactical layer.
 * @property {CharacterResources} resources
 */
export default class CharacterDataModel extends BaseCharacterDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      resources: new SchemaField({
        hp: new EmbeddedDataField(ResourceDataModel, {}),
        mp: new EmbeddedDataField(ResourceDataModel, {}),
      }),
    });
  }

  /** @inheritdoc */
  prepareBaseData() {
  }
}
