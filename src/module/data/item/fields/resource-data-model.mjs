import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import AH from "../../../config.mjs";

/**
 * @property {String} amount An expression or value.
 * @property {AH_Resource} type
 */
export default class ResourceDataModel extends FieldsetDataModel {
  static defineSchema() {
    const { BooleanField, StringField } = foundry.data.fields;
    return {
      enabled: new BooleanField(),
      amount: new StringField({ initial: "", nullable: false }),
      type: new StringField({ initial: "hp", choices: Object.keys(AH.resources), blank: true, nullable: false }),
    };
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/resource-data-model");
  }
}
