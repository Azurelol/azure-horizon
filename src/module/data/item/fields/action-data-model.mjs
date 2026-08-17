import AH, { getFormSelectOptions } from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { TraitsField } from "./_module.mjs";

/**
 * @property {AH_ActionType} type The type of action, if it's one.
 * @property {Number} points How many action points the action costs.
 */
export class ActionDataModel extends FieldsetDataModel {
  static defineSchema() {
    const { StringField, BooleanField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      range: new StringField({
        initial: "",
        blank: true,
        label: "AH.FIELD.Range",
        choices: () => AH.traits.range,
      }),
      type: new StringField({ initial: "", blank: true, choices: Object.keys(AH.actionTypes), required: true }),
      points: new NumberField({ initial: 1, max: 2 }),
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
    if (this.range) {
      config.addTraits(this.range);
    }
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/action-data-model");
  }
}
