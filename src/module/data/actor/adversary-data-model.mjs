import BaseCharacterDataModel from "./base-character-data-model.mjs";
import { BaseParametersDataModel } from "./system/parameters-data-model.mjs";

/**
 * Represents the data of an adversary in combat.
 */
export default class AdversaryDataModel extends BaseCharacterDataModel {

  /**
   * @type {Set<AH_ItemType>}
   */
  static ITEM_TYPES = new Set(["attack"]);

  static defineSchema() {
    const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      parameters: new EmbeddedDataField(BaseParametersDataModel, {}),
    });
  }

  supportsItemType(type) {
    return AdversaryDataModel.ITEM_TYPES.has(type);
  }
}
