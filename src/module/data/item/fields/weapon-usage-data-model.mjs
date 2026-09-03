import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import AH from "../../../config.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

/**
 * @typedef WeaponUsageData
 * @property {Boolean} attributes Replace the check attributes.
 * @property {Boolean} check Replace the check configuration.
 * @property {Boolean} damage Append the damage components.
 */

/**
 * @property {Boolean} attributes Replace the check attributes.
 * @property {Boolean} check Replace the check configuration.
 * @property {Boolean} damage Append the damage components.
 */
export default class WeaponUsageDataModel extends OptionalFieldsetDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, BooleanField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      attributes: new BooleanField({ initial: false }),
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
      attributes: this.attributes,
      damage: this.damage,
    });
  }

  /**
   * @returns {Boolean} If a weapon or attack is needed at all.
   */
  get active() {
    return this.attributes || this.damage || this.check;
  }

  /**
   * @param {ActionConfig} config
   * @param {AHItem} attack
   * @param isCheck
   */
  setOverride(config, attack, isCheck) {
    config.setItemReference(attack);
    // Override check
    if (isCheck && this.check) {
      config.setTargetedDefense(attack.system.check.defense);
    }
    // Override damage
    if (this.damage) {
      attack.system.damage.configureAction(config, {
        label: "AH.ITEM.Weapon",
      });
    }
    // Override attributes
    if (this.attributes) {
      attack.system.attributes.configureAction(config, {});
    }
    // Use attack range
    config.removeTraits("melee", "ranged");
    config.addTraits(attack.system.range);
  }

}
