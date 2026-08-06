import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";

const { SetField, StringField } = foundry.data.fields;

// TODO: Decide on name

/**
 * @description Used when rolls are performed.
 * @extends {SetField}
 */
export default class TraitsField extends SetField {

  constructor(options = {}) {
    super(new StringField(), options);
  }

  /**
	 * @returns {String[]}
	 * @remarks What will actually be used for pipelines that use traits.
	 */
  get values() {
    return Array.from(this);
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/traits-data-model");
  }

  /**
   * @param {Record<String, String>} traits
   * @returns {{label: *, value: *}[]}
   */
  static formatOptions(traits) {
    return Object.entries(traits).map(([key, value]) => ({
      label: key,
      value: value,
    }));
  }

}
