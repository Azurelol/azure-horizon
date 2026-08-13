import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import ActiveFeatureDataModel from "./active-feature-data-model.mjs";
import AH from "../../config.mjs";

/**
 * Abilities belong to adversaries and are their equivalent of PC skills.
 * @inheritDoc
 * @extends ActiveFeatureDataModel
 * @property {CheckDataModel} check
 * @property {DamageDataModel} damage
 * @property {ResourceDataModel} resource
 * @property {EffectsDataModel} effects
 * @property {AH_Intent} intent The intent behind this ability.
 */
export default class AbilityDataModel extends ActiveFeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      intent: new StringField({ initial: "", choices: Object.keys(AH.intents), blank: true, nullable: false, label: "AH.ADVERSARY.Intent" }),
    });
  }

  /**
   * @param {ActionConfig} config
   * @returns {Promise<void>}
   * @private
   */
  async _initializeAction(config) {
    await super._initializeAction(config);
  }
}
