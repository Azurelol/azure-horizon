import { systemTemplatePath } from "../constants.mjs";

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
}
