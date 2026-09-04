import AH, { getFormSelectOptions } from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import { TraitsField } from "./_module.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

/**
 * @property {AH_TargetingRule} rule
 * @property {AH_ActionRange} range
 * @property {TraitsField} traits
 */
export class TargetingDataModel extends OptionalFieldsetDataModel {
  static defineSchema() {
    const { StringField, BooleanField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      range: new StringField({
        initial: "",
        blank: true,
        label: "AH.FIELD.Range",
        choices: () => AH.traits.range,
      }),
      rule: new StringField({
        initial: "",
        blank: true,
        label: "AH.FIELD.Targeting",
        choices: () => AH.targetingRule,
      }),
      traits: new TraitsField({
        options: getFormSelectOptions(AH.traits.target),
      }),
    });
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
    if (this.rule) {
      config.setTargeting(this.rule);
    }
    if (this.range) {
      config.addTraits(this.range);
    }
    config.addTraits(Array.from(this.traits));
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/targeting-data-model");
  }
}
