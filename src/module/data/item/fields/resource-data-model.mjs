import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import AH from "../../../config.mjs";

/**
 * @property {AH_Resource} type
 * @property {String} amount An expression or value.
 */
export default class ResourceDataModel extends FieldsetDataModel {
  static defineSchema() {
    const { BooleanField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      type: new StringField({ initial: "hp", choices: Object.keys(AH.resourceTypes), blank: true, nullable: false }),
      amount: new StringField({ initial: "", nullable: false }),
    });
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
    if (this.enabled) {
      config.setResource(this.type, this.amount);
    }
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/resource-data-model");
  }
}
