import ItemDataModel from "./item-data-model.mjs";
import { CheckDataModel, DamageDataModel } from "./fields/_module.mjs";
import Checks from "../../pipelines/checks.mjs";
import { ActionConfig } from "../../helpers/_module.mjs";
import { FoundryUtils } from '../../utils/_module.mjs';

/**
 * Represents a damaging action in the system.
 * @property {DamageDataModel} damage
 * @property {CheckDataModel} check
 * @remarks This simpler model is used for adversaries.
 */
export default class AttackDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      damage: new EmbeddedDataField(DamageDataModel, FoundryUtils.configureInitial(DamageDataModel, {
        enabled: true
      })),
      check: new EmbeddedDataField(CheckDataModel, { }),
    });
  }

  async perform(modifiers) {
    await Checks.actionCheck(this.parent.actor, this.parent, async (check, actor, item) => {
      const config = new ActionConfig(check);
      await this._initializeAction(config);
    });
    return true;
  }

  /**
   * @param {ActionConfig} config
   * @protected
   * @return {Promise}
   */
  async _initializeAction(config) {
    config.setAttributes(this.check.primary, this.check.secondary);
    config.setTargetedDefense(this.check.defense);
    if (this.damage.enabled) {
      config.setDamage(this.damage.type, this.damage.amount);
    }
  }


}
