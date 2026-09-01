import AH, { getFormSelectOptions } from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { TraitsField } from "./_module.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

/**
 * @property {AH_ActionType} type The type of action, if it's one.
 * @property {AH_TargetingRule} targeting
 * @property {AH_ActionRange} range
 * @property {Number} points How many action points the action costs.
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
