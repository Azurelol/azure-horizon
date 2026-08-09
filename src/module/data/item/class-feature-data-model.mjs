import FeatureDataModel from "./feature-data-model.mjs";

/**
 * A feature includes actions that can be performed by NPCs.
 */
export default class ClassFeatureDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }
}
