/**
 * @typedef AH_ActiveEffectDuration
 * @property {Interval} event The interval event which decrements the duration. Once it reaches 0, the effect is over.
 * @property {Number} interval The number of occurrences between events
 * @property {String} tracking Whom is the duration tracked on
 */

import { SubDocumentCollectionField } from "../api/_module.mjs";
import { RuleElementDataModel } from "./_module.mjs";

/**
 * A data model used by default effects with properties to control the expiration behavior.
 */
export default class ActiveEffectModel extends foundry.data.ActiveEffectTypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      rules: new SubDocumentCollectionField(RuleElementDataModel),
    });
  }
}
