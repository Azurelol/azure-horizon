import AH, { getFormSelectOptions } from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import { TraitsField } from "./_module.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

export class WeaponOptionsDataModel extends OptionalFieldsetDataModel {
  static defineSchema() {
    const { StringField, BooleanField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {

    });
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/weapon-options-data-model");
  }
}
