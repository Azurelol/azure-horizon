import BaseItemDataModel from "./base-item-data-model.mjs";
import { CheckFieldsetMixin } from "./check-behaviour-mixin.mjs";
import { DamageDataModel } from "./fields/_module.mjs";

export default class WeaponDataModel extends CheckFieldsetMixin(BaseItemDataModel) {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      damage: new EmbeddedDataField(DamageDataModel, {}),
    });
  }
}
