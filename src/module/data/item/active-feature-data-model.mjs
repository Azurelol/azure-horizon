import FeatureDataModel from "./feature-data-model.mjs";
import { CheckDataModel, DamageDataModel } from "./fields/_module.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import ResourceDataModel from "./fields/resource-data-model.mjs";
import { ActionCostDataModel } from "./fields/action-cost-data-model.mjs";
import { ActionDataModel } from "./fields/action-data-model.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import { ActionAttributesDataModel } from "./fields/action-attributes-data-model.mjs";
import { TargetingDataModel } from "./fields/targeting-data-model.mjs";

/**
 * Represents an action in the system.
 * @property {ActionDataModel} action
 * @property {CheckDataModel} check
 * @property {DamageDataModel} damage
 * @property {ResourceDataModel} resource
 * @property {EffectsDataModel} effects
 * @property {ActionCostDataModel} cost
 * @property {TargetingDataModel} targeting
 * @remarks This simpler model is used for adversaries.
 */
export default class ActiveFeatureDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField, BooleanField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      attributes: new EmbeddedDataField(ActionAttributesDataModel, {}),
      check: new EmbeddedDataField(CheckDataModel, { }),
      damage: new EmbeddedDataField(DamageDataModel, FoundryUtils.configureInitial(DamageDataModel, {
      })),
      action: new EmbeddedDataField(ActionDataModel, {}),
      resource: new EmbeddedDataField(ResourceDataModel, {}),
      cost: new EmbeddedDataField(ActionCostDataModel, {}),
      targeting: new EmbeddedDataField(TargetingDataModel, {}),
      effects: new EmbeddedDataField(EffectsDataModel, {}),
      power: new StringField({
        initial: "",
        blank: true,
        label: "AH.FIELD.Power",
        _part: "header",
        choices: () => AH.power,
        formOptions: getFormSelectOptions(AH.power),
        nullable: false,
      }),
    });
  }

  isFreeAction(modifiers) {
    if (this.action.traits.has("free")) {
      return true;
    }
    return super.isFreeAction(modifiers);
  }

  *allApplicableTraits() {
    yield* super.allApplicableTraits();
    for (const trait of this.action.traits) {
      yield trait;
    }
    for (const trait of this.targeting.traits) {
      yield trait;
    }
    for (const trait of this.damage.traits) {
      yield trait;
    }
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    await this.action.configureAction(config);
    await this.damage.configureAction(config);
    await this.resource.configureAction(config);
    await this.effects.configureAction(config);
    await this.cost.configureAction(config);
    await this.targeting.configureAction(config);
    if (this.power) {
      config.setPower(this.power);
    }
  }
}
