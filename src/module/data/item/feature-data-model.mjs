import BaseItemModel from "./base-item-model.mjs";

export default class FeatureDataModel extends BaseItemModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }
}
