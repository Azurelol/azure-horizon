import ItemDataModel from "./item-data-model.mjs";
import { CheckDataModel, TraitsField } from "./fields/_module.mjs";
import AH from "../../config.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";

/**
 * Represents a hero's armor, which alters how they defend themselves.
 * @property {AH_ArmorCategory} armorType
 */
export default class ArmorDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        options: FoundryUtils.getFormSelectOptions(AH.traits.armor),
      }),
      category: new StringField({
        initial: "light",
        blank: false,
        label: "AH.FIELD.Category",
        choices: () => AH.armorCategories,
      }),
    });
  }
}
