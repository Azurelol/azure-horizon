import ActiveFeatureDataModel from "./active-feature-data-model.mjs";
import AH from "../../config.mjs";
import EmptyClassFeature from "./classFeatures/empty-class-feature.mjs";
import { systemTemplatePath } from "../../constants.mjs";

/**
 * A feature includes actions that can be performed by NPCs.
 * @property {String} class The class the feature is associated with.
 * @property {String} skill The skill the feature is associated with.
 * @property {ClassFeatureTypeDataModel} feature The instantiated class feature data.
 */
export default class ClassFeatureDataModel extends ActiveFeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, TypedSchemaField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      class: new StringField({ label: "AH.FIELD.Class", _part: "header" }),
      skill: new StringField({ label: "AH.FIELD.Skill", _part: "header" }),
      feature: new TypedSchemaField(AH.dataModelRegistries.classFeature.types, {
        initial: new EmptyClassFeature(),
      }),
    });
  }

  /**
   * @param {String} type
   */
  async changeFeature(type) {
    if (type === this.feature.type) {
      return;
    }
    const model = AH.dataModelRegistries.classFeature.types[type];
    const feature = new model();
    if (feature) {
      await this.update({ "==feature": feature });
    }
  }

  static get templates() {
    return {
      header: systemTemplatePath("sheets/item/item-class-feature"),
    };
  }
}
