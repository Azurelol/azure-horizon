import WeaponUsageDataModel from "./fields/weapon-usage-data-model.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import ActiveFeatureDataModel from "./active-feature-data-model.mjs";
import config from "../../config.mjs";
import AH from "../../config.mjs";

/**
 * Skills belong to character classes and are selected and upgraded during a character's advancement
 * @inheritDoc
 * @extends FeatureDataModel
 * @property {String} class The slug of the class this skill belongs to.
 * @property {Number} level.current
 * @property {Number} level.max
 * @property {WeaponUsageDataModel} usage
 * @property {CheckDataModel} check
 * @property {DamageDataModel} damage
 * @property {ResourceDataModel} resource
 * @property {EffectsDataModel} effects
 */
export default class SkillDataModel extends ActiveFeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      class: new StringField({
        label: "AH.FIELD.Class",
        _part: "header",
      }),
      level: new SchemaField({
        current: new NumberField({ initial: 1, min: 1, integer: true, nullable: false, label: "AH.FIELD.Current", icon: AH.icons.current, _part: "settings" }),
        max: new NumberField({ initial: 1, min: 1, integer: true, nullable: false, label: "AH.FIELD.Maximum", icon: AH.icons.max, _part: "settings" }),
      }),
      usage: new EmbeddedDataField(WeaponUsageDataModel, {}),
    });
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    this.usage.configureAction(config);
  }
}
