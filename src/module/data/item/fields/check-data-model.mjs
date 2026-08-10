import AH from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

/**
 * @property {AH_Attribute} primary
 * @property {AH_Attribute} secondary
 * @property {AH_Defense} defense
 * @property {String} bonus
 */
export default class CheckDataModel extends OptionalFieldsetDataModel {
  static defineSchema() {
    const { SchemaField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      primary: new StringField({ initial: "dex", blank: true, choices: Object.keys(AH.attributes) }),
      secondary: new StringField({ initial: "mig", blank: true, choices: Object.keys(AH.attributes) }),
      defense: new StringField({ initial: "def", choices: Object.keys(AH.defenses), blank: true }),
      bonus: new StringField(),
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/check-data-model");
  }
}
