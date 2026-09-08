import { SubDocumentCollectionField, TrackerDataModel } from "../api/_module.mjs";
import { RuleElementDataModel } from "./_module.mjs";

/**
 * @typedef AH_ActiveEffectDuration
 * @property {Interval} event The interval event which decrements the duration. Once it reaches 0, the effect is over.
 * @property {Number} interval The number of occurrences between events
 * @property {String} tracking Whom is the duration tracked on
 */

/**
 * @typedef AH_EffectStacking
 * @property {Boolean} progress Whether the tracker sections should stack, increasing it when re-applied.
 * @property {Boolean} duration Whether the effect duration should stack, increasing it when re-applied.
 * @property {Number} increment
 */

/**
 * A data model used by default effects with properties to control the expiration behavior.
 * @property {TrackerDataModel} tracker
 * @property {AH_EffectStacking} stacking
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
    const { EmbeddedDataField, StringField, SchemaField, BooleanField, NumberField } = foundry.data.fields;
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
      stacking: new SchemaField({
        tracker: new BooleanField(),
        duration: new BooleanField(),
        increment: new NumberField({ initial: 1, nullable: false }),
      }),
      rules: new SubDocumentCollectionField(RuleElementDataModel),
    });
  }

  /**
   * @returns {Boolean} Whether this effect can stack.
   */
  get canStack() {
    return (this.stacking.tracker || this.stacking.duration) && this.stacking.increment;
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
