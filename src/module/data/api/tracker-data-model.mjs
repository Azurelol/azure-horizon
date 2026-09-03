
/**
 * @typedef TrackerSegment
 * @property {Number} id
 * @property {Boolean} checked
 */

/**
 * @typedef TrackerUpdateData
 * @property {Document} document The reference to the document
 * @property {String} propertyPath The path to the property
 * @property {Number} increment How much to update for
 * @property {Number|undefined} index If it's an array, the index of the element
 */

import VersionedDataModel from "./versioned-data-model.mjs";

/**
 * @description Models the tracking whether that be clocks, resources, etc.
 * @property {string} name A label, used for user-facing displays.
 * @property {number} current The current value
 * @property {number} max The maximum value
 * @property {AH_TrackerStyle} style An optional style to use for this track
 * @property {Boolean} enabled Whether this tracker should be used
 * @property {string} id Optionally, a unique identifier for internal lookups.
 */
export default class TrackerDataModel extends VersionedDataModel {
  static defineSchema() {
    const { NumberField, StringField, BooleanField } = foundry.data.fields;
    return {
      enabled: new BooleanField({ initial: false }),
      name: new StringField({ nullable: true }),
      id: new StringField({ nullable: true }),
      current: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
      max: new NumberField({ initial: 6, min: 0, integer: true, nullable: false }),
      style: new StringField({ nullable: true }),
    };
  }

  get isMinimum() {
    return this.current === 0;
  }

  get isMaximum() {
    return this.current === this.max;
  }

  /**
   * @returns {TrackerSegment[]}
   */
  get segments() {
    return Array.from({ length: this.max }, (_, i) => ({
      id: i + 1,
      checked: this.current === i + 1,
    })).reverse();
  }

  /**
   * @param {Number} increment
   * @param {Number} step
   * @returns {number}
   */
  calculateUpdatedValue(increment, step = undefined) {
    const max = this.max;
    let result;
    if (step) {
      result = this.current + increment * step;
    } else {
      result = this.current + increment;
    }
    if (max !== 0) {
      result = Math.min(result, max);
    }
    return result;
  }

}
