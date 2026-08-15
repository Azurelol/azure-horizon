import ItemDataModel from "./item-data-model.mjs";
import ClassBenefitsDataModel from "./fields/class-benefits-data-model.mjs";
import { TraitsField } from "./fields/_module.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";

/**
 * @property {ClassBenefitsDataModel} benefits
 */
export default class ClassDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        options: getFormSelectOptions(AH.traits.class),
      }),
      benefits: new EmbeddedDataField(ClassBenefitsDataModel, {}),
    });
  }
}
