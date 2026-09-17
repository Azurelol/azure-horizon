import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";

const { StringField, ArrayField, NumberField, SchemaField, EmbeddedDataField } = foundry.data.fields;

export class PotentialField extends SchemaField {
  constructor(options = {}) {
    super({
      text: new StringField(),
    }, options);
  }
}

/**
 * @property {String[]} entries
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
