import ActiveFeatureDataModel from "./active-feature-data-model.mjs";
import AH from "../../config.mjs";
import EmptyClassFeature from "./classFeatures/empty-class-feature.mjs";

/**
 * A feature includes actions that can be performed by NPCs.
 * @property {ClassFeatureTypeDataModel} feature The instantiated class feature data.
 */
export default class ClassFeatureDataModel extends ActiveFeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, TypedSchemaField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      class: new StringField({
        label: "AH.FIELD.Class",
      }),
      feature: new TypedSchemaField(AH.dataModelRegistries.classFeature.types, {
        initial: new EmptyClassFeature(),
      }),
    });
  }
}
