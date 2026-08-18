import ItemDataModel from "./item-data-model.mjs";
import { Actions } from "../../pipelines/_module.mjs";
import { DamageDataModel } from "./fields/_module.mjs";
import ResourceDataModel from "./fields/resource-data-model.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";

/**
 * A follower-facing feature. They require no checks and are simplified.
 * @property {DamageDataModel} damage
 * @property {ResourceDataModel} resource
 * @property {EffectsDataModel} effects
 * @property {AH_TriggerType} trigger
 * @property {AH_Power} power
 */
export default class MoveDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      trigger: new StringField({ initial: "", blank: true, label: "AH.FIELD.Trigger", choices: Object.keys(AH.triggers), formOptions: getFormSelectOptions(AH.triggers), nullable: false }),
      power: new StringField({ initial: "", blank: true, label: "AH.FIELD.Power", choices: Object.keys(AH.power), formOptions: getFormSelectOptions(AH.power), nullable: false }),
      damage: new EmbeddedDataField(DamageDataModel, {}),
      resource: new EmbeddedDataField(ResourceDataModel, {}),
      effects: new EmbeddedDataField(EffectsDataModel, {}),
    });
  }

  /**
   * @param {KeyboardModifiers} modifiers
   * @returns {Promise<boolean>}
   */
  async perform(modifiers) {
    await Actions.perform(this.parent.actor, this.parent, async (config, actor, item) => {
      await this.damage.configureAction(config);
      await this.resource.configureAction(config);
      await this.effects.configureAction(config);
      if (this.power) {
        config.setPower(this.power);
      }
    });
    return true;
  }
}
