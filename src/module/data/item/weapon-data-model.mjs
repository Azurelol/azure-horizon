import AttackDataModel from "./attack-data-model.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import { WeaponOptionsDataModel } from "./fields/weapon-options-data-model.mjs";
import { EquipmentDataMixin } from "./equipment-data-model.mjs";
import { TraitsField } from "./fields/_module.mjs";

/**
 * Represents a hero's weapon, used for performing basic attacks and with some skills.
 * @property {DamageDataModel} damage
 * @property {AH_ActionRange} range
 * @property {CheckDataModel} check
 * @property {AH_Handedness} handedness
 * @property {AH_EquipmentWeight} weight
 * @property {AH_WeaponTrait[]} traits
 * @property {WeaponOptionsDataModel} options
 */
export default class WeaponDataModel extends EquipmentDataMixin(AttackDataModel) {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      weight: new StringField({
        initial: "light",
        _part: "header",
        label: "AH.FIELD.Weight",
        choices: () => AH.equipmentWeight,
      }),
      handedness: new StringField({
        initial: "one",
        label: "AH.FIELD.Handedness",
        _part: "header",
        choices: () => AH.handedness,
      }),
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        _part: "header",
        formOptions: getFormSelectOptions(AH.traits.weapon),
        choices: () => AH.traits.weapon,
      }),
      options: new EmbeddedDataField(WeaponOptionsDataModel, {}),
    });
  }

  *allApplicableTraits() {
    yield* super.allApplicableTraits();
    yield this.weight;
    for (const trait of this.traits) {
      yield trait;
    }
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    await this.options.configureAction(config);
    config.addTraits(Array.from(this.traits));
  }
}
