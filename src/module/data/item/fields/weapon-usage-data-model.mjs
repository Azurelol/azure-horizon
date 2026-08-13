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
 * @property {AH_Power} power
 */
export default class WeaponUsageDataModel extends FieldsetDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, BooleanField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      check: new BooleanField({ initial: false }),
      damage: new BooleanField({ initial: false }),
      power: new StringField({ initial: "", blank: true, choices: Object.keys(AH.power), nullable: false }),
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
    if (this.damage) {
      if (this.power) {
        config.modifyDamage(d => {
          d.modify("universal", {
            key: "skill",
            multiplicative: AH.power[this.power].value,
          });
        });
      }
    }
  }
}
