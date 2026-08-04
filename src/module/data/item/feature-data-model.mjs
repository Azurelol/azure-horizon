import ItemDataModel from "./item-data-model.mjs";
import { CheckDataModel } from "./fields/_module.mjs";
import { systemTemplatePath } from '../../constants.mjs';

/**
 * A feature includes actions that can be performed by NPCs.
 * @property {CheckDataModel} check
 */
export default class FeatureDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      check: new EmbeddedDataField(CheckDataModel, { }),
    });
  }
}
