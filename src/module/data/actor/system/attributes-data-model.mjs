import AttributeDataModel from "./attribute-data-model.mjs";

/**
 * The set of attributes for a character.
 * @property {AttributeDataModel} mig
 * @property {AttributeDataModel} dex
 * @property {AttributeDataModel} ins
 * @property {AttributeDataModel} wlp
 */
export default class AttributesDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const { EmbeddedDataField } = foundry.data.fields;
    return {
      mig: new EmbeddedDataField(AttributeDataModel, {}),
      dex: new EmbeddedDataField(AttributeDataModel, {}),
      ins: new EmbeddedDataField(AttributeDataModel, {}),
      wlp: new EmbeddedDataField(AttributeDataModel, {}),
    };
  }
}
