import FeatureDataModel from "./feature-data-model.mjs";
import { CheckDataModel } from "./fields/_module.mjs";
import { CheckFieldsetMixin } from "./check-behaviour-mixin.mjs";

export default class SkillDataModel extends CheckFieldsetMixin(FeatureDataModel) {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }
}
