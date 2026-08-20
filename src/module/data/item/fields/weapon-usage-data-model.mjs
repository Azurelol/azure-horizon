import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import AH from "../../../config.mjs";

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
      check: new BooleanField({ initial: false }),
      damage: new BooleanField({ initial: false }),
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/weapon-usage-data-model");
  }

  /**
   * @param {ActionConfig} config
   */
  configureAction(config) {
    config.setWeaponUsage({
      check: this.check,
      damage: this.damage,
    });
  }
}
