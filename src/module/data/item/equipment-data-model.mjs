import ItemDataModel from "./item-data-model.mjs";
import { TraitsField } from "./fields/_module.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";

export default class EquipmentDataModel extends EquipmentDataMixin(ItemDataModel) {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      // equipment-specific fields go here
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
      const { StringField } = foundry.data.fields;
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
