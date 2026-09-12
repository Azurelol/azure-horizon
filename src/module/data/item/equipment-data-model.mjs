import ItemDataModel from "./item-data-model.mjs";
import { TraitsField } from "./fields/_module.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";

/**
 * @property {AH_Rarity} rarity
 */
export default class EquipmentDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField } = foundry.data.fields;
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
}
