import BaseItemDataModel from "./base-item-data-model.mjs";
import { CheckDataModel, DamageDataModel } from "./fields/_module.mjs";
import Checks from "../../pipelines/checks.mjs";
import { ActionConfig } from "../../helpers/_module.mjs";

/**
 * @property {DamageDataModel} damage
 * @property {CheckDataModel} check
 */
export default class WeaponDataModel extends BaseItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      damage: new EmbeddedDataField(DamageDataModel, {}),
      check: new EmbeddedDataField(CheckDataModel, { }),
    });
  }

  async perform(modifiers) {
    await Checks.actionCheck(this.parent.actor, this.parent, this.#initializeWeaponAttack(modifiers));
    return true;
  }

  /**
   * @param {KeyboardModifiers} modifiers
   * @return {CheckPrepareCallback}
   */
  #initializeWeaponAttack(modifiers) {
    return async (check, actor, item) => {
      const config = new ActionConfig(check);
      config.setAttributes(this.check.primary, this.check.secondary);
      config.setTargetedDefense(this.check.defense);
      config.setDamage(this.damage.type, this.damage.amount);
    };
  }
}
