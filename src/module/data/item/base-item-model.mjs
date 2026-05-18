/**
 * A base item model that provides basic description and source metadata for an item instance.
 */
export default class BaseItemModel extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, NumberField } = foundry.data.fields;
    return {
    };
  }
}
