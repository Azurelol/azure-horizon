import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";

const { SchemaField, NumberField, BooleanField, StringField, EmbeddedDataField, ArrayField } = foundry.data.fields;

/**
 * @property {Boolean} hp
 * @property {Boolean} mp
 * @property {Boolean} ip
 */
export default class ClassBenefitsDataModel extends FieldsetDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      hp: new BooleanField(),
      mp: new BooleanField(),
      ip: new BooleanField(),
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/class-benefits-data-model");
  }
}
