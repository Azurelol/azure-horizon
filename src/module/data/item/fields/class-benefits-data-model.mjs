import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import { ModifierDataField } from "../../api/_module.mjs";

const { SchemaField, NumberField, StringField, EmbeddedDataField, ArrayField } = foundry.data.fields;

/**
 * Used for class-specific benefits.
 */
export class BenefitDataField extends SchemaField {
  constructor(options = {}) {
    super({
      additive: new NumberField(),
      multiplicative: new NumberField(),
    }, options);
  }
}

/**
 * @property {ModifierDataField} hp
 * @property {ModifierDataField} mp
 * @property {ModifierDataField} ip
 */
export default class ClassBenefitsDataModel extends FieldsetDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      hp: new BenefitDataField(),
      mp: new BenefitDataField(),
      ip: new BenefitDataField(),
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/class-benefits-data-model");
  }
}
