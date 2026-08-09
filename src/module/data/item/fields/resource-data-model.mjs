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
      amount: new StringField({ initial: "", nullable: false }),
      type: new StringField({ initial: "hp", choices: Object.keys(AH.resourceTypes), blank: true, nullable: false }),
    };
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
    if (this.enabled) {
    }
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/resource-data-model");
  }
}
