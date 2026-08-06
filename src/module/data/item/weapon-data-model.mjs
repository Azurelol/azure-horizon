import AttackDataModel from "./attack-data-model.mjs";
import AH from "../../config.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";

/**
 * Represents a hero's weapon, used for performing basic attacks and with some skills.
 * @property {DamageDataModel} damage
 * @property {CheckDataModel} check
 * @property {AH_Handedness} handedness
 */
export default class WeaponDataModel extends AttackDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      handedness: new StringField({
        initial: "one",
        blank: false,
        label: "AH.FIELD.Handedness",
        choices: () => AH.handedness,
      }),
    });
  }
}
