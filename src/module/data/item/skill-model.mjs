import FeatureDataModel from "./feature-data-model.mjs";

export default class SkillModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      description: new HTMLField({}),
    });
  }
}
