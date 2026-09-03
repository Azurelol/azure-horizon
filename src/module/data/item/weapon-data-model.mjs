import AttackDataModel from "./attack-data-model.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import { WeaponOptionsDataModel } from "./fields/weapon-options-data-model.mjs";

/**
 * Represents a hero's weapon, used for performing basic attacks and with some skills.
 * @property {DamageDataModel} damage
 * @property {AH_ActionRange} range
 * @property {CheckDataModel} check
 * @property {AH_Handedness} handedness
 * @property {AH_WeaponTrait[]} traits
 * @property {WeaponOptionsDataModel} options
 */
export default class WeaponDataModel extends AttackDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      handedness: new StringField({
        initial: "one",
        blank: false,
        label: "AH.FIELD.Handedness",
        _part: "header",
        choices: () => AH.handedness,
      }),
      options: new EmbeddedDataField(WeaponOptionsDataModel, {}),
    });
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    await this.options.configureAction(config);
  }
}
