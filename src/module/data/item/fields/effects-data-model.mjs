import AH from "../../../config.mjs";
import { VersionedDataModel } from "../../api/_module.mjs";
import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";

/**
 * @typedef ApplyEffectData
 * @property {String[]} entries
 * @property {AH_ActiveEffectDuration} duration
 */

/**
 * @description Used when rolls are performed.
 * @implements ApplyEffectData
 * @property {AH_ActiveEffectDuration} duration
 * @property {Set<String>} entries
 */
export class EffectsDataModel extends FieldsetDataModel {
  static defineSchema() {
    const { StringField, SchemaField, ArrayField, BooleanField, NumberField } = foundry.data.fields;
    return {
      entries: new ArrayField(new StringField({ nullable: true })),
      duration: new SchemaField({
        event: new StringField({ initial: "", blank: true, choices: Object.keys(AH.intervals) }),
        interval: new NumberField({ min: 0, blank: true, integer: true }),
        tracking: new StringField({ initial: "", blank: true, choices: Object.keys(AH.effectTracking) }),
      }),
    };
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
    if (this.entries.size > 0) {
    }
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/effects-data-model");
  }
}
