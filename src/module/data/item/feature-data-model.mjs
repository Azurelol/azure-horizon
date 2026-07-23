import BaseItemDataModel from "./base-item-data-model.mjs";
import { CheckDataModel } from "../fields/_module.mjs";

/**
 * @property {CheckDataModel} check
 */
export default class FeatureDataModel extends BaseItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      check: new EmbeddedDataField(CheckDataModel, { initial: { primary: { value: "ins" }, secondary: { value: "mig" } } }),
    });
  }
}
