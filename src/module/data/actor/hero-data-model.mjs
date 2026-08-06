import BaseCharacterDataModel from "./base-character-data-model.mjs";
import { ResourceDataModel } from "../api/resource-data-model.mjs";
import { HeroParametersDataModel } from "./system/_module.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import EquipmentDataModel from "./system/equipment-data-model.mjs";

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
 * Represents the data of PC in combat.
 * @property {HeroParametersDataModel} parameters
 * @property {EquipmentDataModel} equipment
 */
export default class HeroDataModel extends BaseCharacterDataModel {

  /**
   * @type {Set<AH_ItemType>}
   */
  static ITEM_TYPES = new Set(["class", "skill", "weapon", "consumable", "spell"]);

  static defineSchema() {
    const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      equipment: new EmbeddedDataField(EquipmentDataModel, {}),
      parameters: new EmbeddedDataField(HeroParametersDataModel, {}),
    });
  }

  /** @inheritdoc */
  prepareBaseData() {
  }

  _prepareParameters() {
    super._prepareParameters();
    this.parameters.ip.defineMaximumProperty(() => Formulas.calculateInventoryPoints());
    this.parameters.tp.defineMaximumProperty(() => Formulas.calculateTensionPoints());
  }

  supportsItemType(type) {
    return HeroDataModel.ITEM_TYPES.has(type);
  }
}
