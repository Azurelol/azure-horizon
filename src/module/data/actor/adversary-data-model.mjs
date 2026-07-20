import BaseCharacterDataModel from "./base-character-data-model.mjs";
import { BaseParametersDataModel } from "./system/parameters-data-model.mjs";

/**
 * Represents the data of an adversary in combat.
 */
export default class AdversaryDataModel extends BaseCharacterDataModel {
  static defineSchema() {
    const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      parameters: new EmbeddedDataField(BaseParametersDataModel, {}),
    });
  }
}
