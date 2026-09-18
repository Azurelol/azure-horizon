import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";

const { StringField, HTMLField, ArrayField, NumberField, SchemaField, EmbeddedDataField } = foundry.data.fields;

/**
 * Represents an equipment's potential.
 * @property {String} text
 */
export class PotentialField extends SchemaField {
  constructor(options = {}) {
    super({
      text: new HTMLField(),
    }, options);
  }

  /** @override */
  _toInput(config) {
    const container = document.createElement("div");
    container.classList.add("ah-field__potential");

    const textField = this.fields.text;
    const textInput = textField.toInput({
      ...config,
      name: `${config.name}.text`,
      value: config.value?.text ?? "",
    });

    container.append(textInput);
    return container;
  }

  // /** @override */
  // toFormGroup(groupConfig = {}, inputConfig = {}) {
  //   const group = super.toFormGroup(groupConfig, inputConfig);
  //   group.classList.add("ah-potential-form-group");
  //   return group;
  // }
}

/**
 * @property {PotentialField[]} entries
 */
export class PotentialsDataModel extends FieldsetDataModel {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      entries: new ArrayField(new PotentialField({})),
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/potentials-data-model");
  }

}
