import { AttributeDataModel } from "./attribute-data-model.mjs";

/**
 * The set of attributes for a character.
 * @property {AttributeDataModel} str
 * @property {AttributeDataModel} dex
 * @property {AttributeDataModel} per
 * @property {AttributeDataModel} res
 */
export default class AttributesDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const { EmbeddedDataField } = foundry.data.fields;
    return {
      str: new EmbeddedDataField(AttributeDataModel, {}),
      dex: new EmbeddedDataField(AttributeDataModel, {}),
      per: new EmbeddedDataField(AttributeDataModel, {}),
      res: new EmbeddedDataField(AttributeDataModel, {}),
    };
  }
}
