import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";

/**
 * @typedef WeaponUsageData
 * @property {Boolean} check Replace the check attributes.
 * @property {Boolean} damage Append the damage components.
 */

/**
 * @property {Boolean} check Replace the check attributes.
 * @property {Boolean} damage Append the damage components.
 */
export default class WeaponUsageDataModel extends FieldsetDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, BooleanField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      check: new BooleanField(),
      damage: new BooleanField(),
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/weapon-usage-data-model");
  }

  /**
   * @param {ActionConfig} config
   */
  configureAction(config) {
    if (this.enabled) {
      config.setWeaponUsage({
        check: this.usage.check,
        damage: this.usage.damage,
      });
    }
  }
}
