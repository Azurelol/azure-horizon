import { SubDocumentCollectionField } from "../api/_module.mjs";
import { RuleElementDataModel } from "./_module.mjs";

/**
 * @typedef AH_ActiveEffectDuration
 * @property {Interval} event The interval event which decrements the duration. Once it reaches 0, the effect is over.
 * @property {Number} interval The number of occurrences between events
 * @property {String} tracking Whom is the duration tracked on
 */

/**
 * A data model used by default effects with properties to control the expiration behavior.
 * @property {RuleElementDataModel[]} rules
 */
export default class ActiveEffectModel extends foundry.data.ActiveEffectTypeDataModel {

  /**
   * @type {SubDocumentMetadata}
   */
  static get metadata() {
    return {
      embedded: {
        ruleElement: "system.rules",
      },
    };
  }

  static defineSchema() {
    const fields = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      rules: new SubDocumentCollectionField(RuleElementDataModel),
    });
  }
}
