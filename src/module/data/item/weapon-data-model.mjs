import BaseItemDataModel from "./base-item-data-model.mjs";
import { CheckFieldsetMixin } from "./check-behaviour-mixin.mjs";

export default class WeaponDataModel extends CheckFieldsetMixin(BaseItemDataModel) {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }
}
