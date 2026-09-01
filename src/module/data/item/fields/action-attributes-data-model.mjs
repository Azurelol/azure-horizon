import AH from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

/**
 * @property {AH_Attribute} primary
 * @property {AH_Attribute} secondary
 */
export class ActionAttributesDataModel extends OptionalFieldsetDataModel {
  static defineSchema() {
    const { SchemaField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      primary: new StringField({ initial: "dex", blank: true, choices: Object.keys(AH.attributes) }),
      secondary: new StringField({ initial: "mig", blank: true, choices: Object.keys(AH.attributes) }),
      grade: new StringField({ initial: "C", choices: Object.keys(AH.grades), nullable: false }),
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/attributes-data-model");
  }

  /**
   * @param {ActionConfig} config
   * @param options
   */
  configureAction(config, options = {}) {
    if (this.active) {
      config.setAttributes(this.primary, this.secondary);
      config.setGrade(this.grade);
    }
  }
}
