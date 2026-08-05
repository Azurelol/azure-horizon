import FeatureDataModel from "./feature-data-model.mjs";

/**
 * Skills belong to character classes and are selected and upgraded during a character's advancement
 * @inheritDoc
 * @extends FeatureDataModel
 * @property {Number} level.current The current skill level
 * @property {Number} level.max The maximum skill level
 * @property {AH_Slug} class The slug of the class this belongs to. Used for indexing.
 */
export default class SkillDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      level: new SchemaField({
        current: new NumberField({ initial: 1, min: 1, integer: true, nullable: false }),
        max: new NumberField({ initial: 1, min: 1, integer: true, nullable: false }),
      }),
      class: new SchemaField({ value: new StringField() }),
    });
  }
}
