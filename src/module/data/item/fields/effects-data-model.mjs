import AH, { getFormSelectOptions } from "../../../config.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

/**
 * @typedef ApplyEffectData
 * @property {AH_EffectSelector} selector
 * @property {String[]} entries
 * @property {AH_ActiveEffectDuration} duration
 */

/**
 * @description Used when rolls are performed.
 * @implements ApplyEffectData
 * @property {AH_EffectSelector} selector
 * @property {AH_ActiveEffectDuration} duration
 * @property {Set<String>} entries
 */
export class EffectsDataModel extends OptionalFieldsetDataModel {
  static defineSchema() {
    const { StringField, SchemaField, ArrayField, BooleanField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      selector: new StringField({ initial: "", blank: true, choices: Object.keys(AH.effectSelector), formOptions: getFormSelectOptions(AH.effectSelector) }),
      entries: new ArrayField(new StringField({ nullable: true })),
      duration: new SchemaField({
        event: new StringField({ initial: "", blank: true, choices: Object.keys(AH.intervals) }),
        interval: new NumberField({ min: 0, blank: true, integer: true }),
        tracking: new StringField({ initial: "", blank: true, choices: Object.keys(AH.effectTracking) }),
      }),
    });
  }

  static migrateData(source) {
    if (source.selector === "allies") {
      source.selector = "";
    }
    return super.migrateData(source);
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
    if (this.active) {
      if (this.entries.length > 0) {
        config.setEffects(this);
      }
    }
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/effects-data-model");
  }
}
