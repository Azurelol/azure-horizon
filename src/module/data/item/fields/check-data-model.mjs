import AH from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

/**
 * @property {AH_Defense} defense
 * @property {String} bonus
 * @property {AH_ActionCheckVariant} variant
 */
export default class CheckDataModel extends OptionalFieldsetDataModel {
  static defineSchema() {
    const { SchemaField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      defense: new StringField({ initial: "def", choices: Object.keys(AH.defenses), blank: true }),
      bonus: new StringField(),
      variant: new StringField({ initial: "", blank: true, choices: Object.keys(AH.actionCheckVariant) }),
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/check-data-model");
  }
}
