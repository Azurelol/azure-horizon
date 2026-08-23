import ItemDataModel from "./item-data-model.mjs";

/**
 * An engram is an item that allows the user to cast magic or perform certain abilities they could not otherwise.
 */
export default class EngramDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, ForeignDocumentField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      // eslint-disable-next-line no-undef
      item: new ForeignDocumentField(Item, { nullable: true }),
    });
  }
}
