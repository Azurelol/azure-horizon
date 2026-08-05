import AttackDataModel from './attack-data-model.mjs';

/**
 * Represents a hero's weapon, used for performing basic attacks and with some skills.
 * @property {DamageDataModel} damage
 * @property {CheckDataModel} check
 */
export default class WeaponDataModel extends AttackDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }
}
