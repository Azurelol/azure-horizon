import AttackDataModel from "./attack-data-model.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import { DamageDataModel, TraitsField } from "./fields/_module.mjs";
import FeatureDataModel from "./feature-data-model.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import config from "../../config.mjs";

/**
 * Represents a hero's weapon, used for performing basic attacks and with some skills.
 * @property {DamageDataModel} damage
 * @property {AH_ActionRange} range
 * @property {CheckDataModel} check
 * @property {AH_Handedness} handedness
 * @property {AH_WeaponTrait[]} traits
 */
export default class WeaponDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      range: new StringField({
        initial: "melee",
        blank: false,
        label: "AH.FIELD.Range",
        choices: () => AH.traits.range,
      }),
      handedness: new StringField({
        initial: "one",
        blank: false,
        label: "AH.FIELD.Handedness",
        choices: () => AH.handedness,
      }),
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        options: getFormSelectOptions(AH.traits.weapon),
      }),
      damage: new EmbeddedDataField(DamageDataModel, FoundryUtils.configureInitial(DamageDataModel, {
        enabled: true,
      })),
    });
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    config.addTraits(this.range);
    await this.damage.configureAction(config);
  }
}
