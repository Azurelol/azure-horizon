import AH, { getFormSelectOptions } from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import { TraitsField } from "./_module.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

/**
 * @property {TraitsField} traits
 */
export class WeaponOptionsDataModel extends OptionalFieldsetDataModel {
  static defineSchema() {
    const { StringField, BooleanField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        formOptions: getFormSelectOptions(AH.traits.weapon),
        choices: () => AH.traits.weapon,
      }),
    });
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
    config.addTraits(Array.from(this.traits));
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/weapon-options-data-model");
  }
}
