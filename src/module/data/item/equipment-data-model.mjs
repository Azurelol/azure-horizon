import ItemDataModel from "./item-data-model.mjs";
import AH from "../../config.mjs";
import { PotentialsDataModel } from "./fields/potentials-data-model.mjs";

const { StringField, ArrayField, NumberField, SchemaField, EmbeddedDataField } = foundry.data.fields;

export default class EquipmentDataModel extends EquipmentDataMixin(ItemDataModel) {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
    });
  }
}

/**
 * Adds a `rarity` field to a DataModel.
 * @param {typeof foundry.abstract.DataModel} Base
 */
export function EquipmentDataMixin(Base) {
  /**
   * @property {AH_Rarity} rarity
   */
  return class EquipmentData extends Base {
    /** @inheritdoc */
    static defineSchema() {
      return Object.assign(super.defineSchema(), {
        rarity: new StringField({
          initial: "common",
          blank: false,
          label: "AH.EQUIPMENT.Rarity",
          _part: "header",
          choices: () => AH.rarity,
        }),
      });
    }

  };
}
