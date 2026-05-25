import { StringUtils } from "./_module.mjs";

const { api, fields, handlebars } = foundry.applications;

export default class FoundryUtils {
  /**
   * @param {HTMLElement} target
   * @returns {Object}
   */
  static getFormData(target) {
    const form = target.closest("form");
    // eslint-disable-next-line no-undef
    const formData = new FormDataExtended(form);
    return foundry.utils.expandObject(formData.object);
  }

  /**
   * @typedef FormSelectOption
   * @property {string} [value]
   * @property {string} [label]
   * @property {string} [group]
   * @property {boolean} [disabled]
   * @property {boolean} [selected]
   * @property {boolean} [rule]
   * @property {Record<string, string>} [dataset]
   */

  /**
   * @param {Record<String, String>} record
   * @returns {FormSelectOption[]}
   * @remarks To be used with specific records.
   */
  static getFormSelectOptions(record) {
    return Object.entries(record).map(([key, value]) => ({
      label: StringUtils.localize(value),
      value: key,
    }));
  }
}
