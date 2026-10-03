import FeatureDataModel from "./feature-data-model.mjs";
import AH from "../../config.mjs";
import TacticaWeaponData from "./tactica/tactica-weapon-data.mjs";

/**
 * Used by units in the tactica sub-system.
 * @property {TacticaTypeDataModel} data The instantiated tactica data.
 */
export default class TacticaItemDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, TypedSchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      data: new TypedSchemaField(AH.dataModelRegistries.tacticaData.types, {
        initial: new TacticaWeaponData(),
        _part: "default",
      }),
    });
  }

  /**
   * @param {String} type
   */
  async changeType(type) {
    if (type === this.data.type) {
      return;
    }
    const model = AH.dataModelRegistries.tacticaData.types[type];
    if (model) {
      const feature = new model();
      if (feature) {
        await this.parent.update({ "system.data": foundry.data.operators.ForcedReplacement.create({
          type: type,
        }) });
      }
    }
    else {
      ui.notifications.warn(`Failed to retrieve data model for type ${type}`);
    }
  }

  /**
   * @param {ActionConfig} config
   * @returns {Promise<void>}
   * @private
   */
  async _initializeAction(config) {
    await super._initializeAction(config);
  }}
