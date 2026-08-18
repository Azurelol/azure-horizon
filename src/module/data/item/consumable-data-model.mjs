import ItemDataModel from "./item-data-model.mjs";
import { DamageDataModel } from "./fields/_module.mjs";
import ResourceDataModel from "./fields/resource-data-model.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import { Actions } from "../../pipelines/_module.mjs";

/**
 * @property {Number} cost The inventory point cost of the consumable.
 * @property {DamageDataModel} damage
 * @property {ResourceDataModel} resource
 * @property {EffectsDataModel} effects
 * @property {Number} cost.amount
 */
export default class ConsumableDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      cost: new SchemaField({
        amount: new NumberField({ initial: 3, min: 0, label: "AH.FIELD.Cost", integer: true, _part: "properties" }),
      }),
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
      config.addExpense({
        resource: "ip",
        amount: this.cost.amount,
        evaluated: false,
      });
      await this.damage.configureAction(config);
      await this.resource.configureAction(config);
      await this.effects.configureAction(config);
    });
    return true;
  }

}
