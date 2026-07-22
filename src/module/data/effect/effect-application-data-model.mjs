import { FU } from "../../../helpers/config.mjs";
import AH from "../../config.mjs";

/**
 * @typedef ApplyEffectData
 * @property {String[]} entries
 * @property {Boolean} prompt Whether to prompt a selection dialog.
 * @property {AH_ActiveEffectDuration} duration
 */

/**
 * @description Used when rolls are performed.
 * @implements ApplyEffectData
 * @property {Boolean} prompt
 * @property {AH_ActiveEffectDuration} duration
 * @property {Set<String>} entries
 */
export class EffectApplicationDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    const { StringField, SchemaField, ArrayField, BooleanField, NumberField } = foundry.data.fields;
    return {
      entries: new ArrayField(new StringField({ nullable: true })),
      prompt: new BooleanField(),
      duration: new SchemaField({
        event: new StringField({ initial: "", blank: true, choices: Object.keys(AH.intervals) }),
        interval: new NumberField({ min: 0, blank: true, integer: true }),
        tracking: new StringField({ initial: "", blank: true, choices: Object.keys(AH.effectTracking) }),
      }),
    };
  }
}
