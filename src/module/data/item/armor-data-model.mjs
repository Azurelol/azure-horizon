import ItemDataModel from "./item-data-model.mjs";
import { CheckDataModel, TraitsField } from "./fields/_module.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";

/**
 * Represents a hero's armor, which alters how they defend themselves.
 * @property {AH_ArmorCategory} category
 * @property {Set<String>} traits
 */
export default class ArmorDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      category: new StringField({
        initial: "light",
        blank: false,
        label: "AH.FIELD.Category",
        choices: () => AH.armorCategories,
      }),
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        options: getFormSelectOptions(AH.traits.armor),
      }),
    });
  }
}
