import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import AH from "../../../config.mjs";

/**
 * @description Used when rolls are performed.
 * @property {String|Number} amount The base value which is generally added to the high roll
 * @property {AH_DamageType} type
 */
export default class DamageDataModel extends FieldsetDataModel {
  static defineSchema() {
    const { BooleanField, NumberField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      amount: new NumberField({ initial: 0, integer: true, nullable: false }),
      type: new StringField({ initial: "untyped", choices: Object.keys(AH.damageTypes), blank: true, nullable: false }),
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/damage-data-model");
  }
}
