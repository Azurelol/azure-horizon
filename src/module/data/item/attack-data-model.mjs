import ActiveFeatureDataModel from "./active-feature-data-model.mjs";
import FeatureDataModel from "./feature-data-model.mjs";
import { DamageDataModel } from "./fields/_module.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import AH from "../../config.mjs";

/**
 * Represents a damaging action in the system.
 * @property {AH_ActionRange} range
 * @property {CheckDataModel} check
 * @property {DamageDataModel} damage
 * @remarks This simpler model is used for adversaries.
 */
export default class AttackDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField, BooleanField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      range: new StringField({
        initial: "melee",
        blank: false,
        label: "AH.FIELD.Range",
        choices: () => AH.actionRange,
      }),
      damage: new EmbeddedDataField(DamageDataModel, FoundryUtils.configureInitial(DamageDataModel, {
        enabled: true,
      })),
    });
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    await this.damage.configureAction(config);
  }
}
