import FeatureDataModel from "./feature-data-model.mjs";
import ActiveFeatureDataModel from "./active-feature-data-model.mjs";

/**
 * A feature includes actions that can be performed by NPCs.
 * @property {String} class The slug of the class this feature belongs to.
 * @property {String} skill The slug of the class this feature belongs to.
 */
export default class ClassFeatureDataModel extends ActiveFeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      class: new StringField({
        label: "AH.FIELD.Class",
      }),
    });
  }
}
