import ItemDataModel from './item-data-model.mjs';

/**
 * @property {Number} cost The inventory point cost of the consumable.
 */
export default class ConsumableDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      cost: new NumberField({ initial: 3, min: 0, label: "AH.FIELD.Cost", integer: true })
    });
  }}
