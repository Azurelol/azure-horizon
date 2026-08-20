import FeatureDataModel from "./feature-data-model.mjs";
import { DamageDataModel } from "./fields/_module.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import ResourceDataModel from "./fields/resource-data-model.mjs";
import { ActionCostDataModel } from "./fields/action-cost-data-model.mjs";
import { ActionDataModel } from "./fields/action-data-model.mjs";
import AH from "../../config.mjs";

/**
 * Represents an action in the system.
 * @property {ActionDataModel} action
 * @property {CheckDataModel} check
 * @property {DamageDataModel} damage
 * @property {ResourceDataModel} resource
 * @property {EffectsDataModel} effects
 * @property {ActionCostDataModel} cost
 * @remarks This simpler model is used for adversaries.
 */
export default class ActiveFeatureDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField, BooleanField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      damage: new EmbeddedDataField(DamageDataModel, FoundryUtils.configureInitial(DamageDataModel, {
        enabled: true,
      })),
      resource: new EmbeddedDataField(ResourceDataModel, {}),
      cost: new EmbeddedDataField(ActionCostDataModel, {}),
      effects: new EmbeddedDataField(EffectsDataModel, {}),
    });
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    await this.damage.configureAction(config);
    await this.resource.configureAction(config);
    await this.effects.configureAction(config);
    await this.cost.configureAction(config);
  }
}
