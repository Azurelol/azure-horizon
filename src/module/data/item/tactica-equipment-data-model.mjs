import FeatureDataModel from "./feature-data-model.mjs";
import { ActionAttributesDataModel } from "./fields/action-attributes-data-model.mjs";
import { CheckDataModel, DamageDataModel } from "./fields/_module.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import ResourceDataModel from "./fields/resource-data-model.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";

/**
 * Used by units in the tactica sub-system.
 * @property {ActionAttributesDataModel} attributes
 * @property {CheckDataModel} check
 * @property {DamageDataModel} damage
 * @property {ResourceDataModel} resource
 * @property {EffectsDataModel} effects
 */
export default class TacticaEquipmentDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField, BooleanField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      attributes: new EmbeddedDataField(ActionAttributesDataModel, {}),
      check: new EmbeddedDataField(CheckDataModel, {}),
      damage: new EmbeddedDataField(DamageDataModel, FoundryUtils.configureInitial(DamageDataModel, {})),
      resource: new EmbeddedDataField(ResourceDataModel, {}),
      effects: new EmbeddedDataField(EffectsDataModel, {}),
    });
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    await this.damage.configureAction(config);
    await this.resource.configureAction(config);
    await this.effects.configureAction(config);
  }
}
