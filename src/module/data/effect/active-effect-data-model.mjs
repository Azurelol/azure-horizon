import { SubDocumentCollectionField, TrackerDataModel } from "../api/_module.mjs";
import { RuleElementDataModel } from "./_module.mjs";

/**
 * @typedef AH_ActiveEffectDuration
 * @property {Interval} event The interval event which decrements the duration. Once it reaches 0, the effect is over.
 * @property {Number} interval The number of occurrences between events
 * @property {String} tracking Whom is the duration tracked on
 */

/**
 * A data model used by default effects with properties to control the expiration behavior.
 * @property {TrackerDataModel} tracker
 * @property {RuleElementDataModel[]} rules
 */
export default class ActiveEffectDataModel extends foundry.data.ActiveEffectTypeDataModel {

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
    const { EmbeddedDataField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      slug: new StringField({
        required: false,
        blank: true,
        initial: "",
        config: false,
        label: "AH.ITEM.Slug",
        validate: (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      }),
      tracker: new EmbeddedDataField(TrackerDataModel, { required: false }),
      rules: new SubDocumentCollectionField(RuleElementDataModel),
    });
  }

  /**
   * An effect is also temporary if...?
   * @returns {boolean | null}
   * @internal
   */
  get _isTemporary() {
    return false;
  }
}
