import AH, { getFormSelectOptions } from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import { TraitsField } from "./_module.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

/**
 * @property {AH_TargetingRule} rule
 * @property {AH_ActionRange} range
 * @property {AH_TargetingArea} area
 * @property {Boolean} telegraph
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
        choices: () => AH.targeting.rule,
      }),
      area: new StringField({
        initial: "",
        blank: true,
        label: "AH.FIELD.Area",
        choices: () => AH.targeting.area,
      }),
      telegraph: new BooleanField({
        initial: false,
      }),
    });
  }

  /**
   * @yields {string}
   */
  *applicableTraits() {
    if (this.range) {
      yield this.range;
    }
    if (this.area) {
      yield this.area;
    }
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
    if (this.rule) {
      config.setTargeting(this.rule);
    }
    for (const trait of this.applicableTraits()) {
      config.addTraits(trait);
    }
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/targeting-data-model");
  }
}
