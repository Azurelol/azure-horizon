import ItemDataModel from "./item-data-model.mjs";
import ClassBenefitsDataModel from "./fields/class-benefits-data-model.mjs";
import { TraitsField } from "./fields/_module.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";

/**
 * @property {ClassBenefitsDataModel} benefits
 * @property {TraitsField} traits
 * @property {String[]} triggers The experience triggers for this class.
 */
export default class ClassDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, ArrayField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      benefits: new EmbeddedDataField(ClassBenefitsDataModel, {}),
      triggers: new ArrayField(new StringField({ nullable: true }, {
        label: "AH.FIELD.ExperienceTrigger",
      })),
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        _part: "header",
        formOptions: getFormSelectOptions(AH.traits.class),
      }),
    });
  }
}
