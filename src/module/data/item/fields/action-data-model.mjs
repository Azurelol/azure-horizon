import AH, { getFormSelectOptions } from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { TraitsField } from "./_module.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

/**
 * @property {AH_ActionType} type The type of action, if it's one.
 * @property {Number} points How many action points the action costs.
 * @property {TraitsField} traits
 */
export class ActionDataModel extends OptionalFieldsetDataModel {
  static defineSchema() {
    const { StringField, BooleanField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      type: new StringField({ initial: "", blank: true, choices: Object.keys(AH.actionTypes), required: true }),
      points: new NumberField({ initial: 1, max: 3 }),
      traits: new TraitsField({
        options: getFormSelectOptions(AH.traits.action),
      }),
    });
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
    if (this.type) {
      switch (this.type) {
        case "action":
          config.addTags({
            tag: AH.actionTypes.action.label,
            value: this.points,
          });
          break;
        case "reaction":
          config.addTags({
            tag: AH.actionTypes.reaction.label,
          });
          break;
      }
    }
    config.addTraits(Array.from(this.traits));
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/action-data-model");
  }
}
