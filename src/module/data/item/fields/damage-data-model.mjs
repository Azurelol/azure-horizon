import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import AH from "../../../config.mjs";

/**
 * @description Used when rolls are performed.
 * @property {number} amount The base value which is generally added to the high roll
 * @property {String} onRoll An expression which is evaluated during the roll.
 * @property {String} onApply An expression which is evaluated during damage application.
 * @property {AH_DamageType} type
 */
export default class DamageDataModel extends FieldsetDataModel {
  static defineSchema() {
    const { BooleanField, NumberField, StringField } = foundry.data.fields;
    return {
      amount: new NumberField({ initial: 0, integer: true, nullable: false }),
      onRoll: new StringField({ blank: true }),
      onApply: new StringField({ blank: true }),
      type: new StringField({ initial: "physical", choices: Object.keys(AH.damageTypes), blank: true, nullable: false }),
    };
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/damage-data-model");
  }
}
