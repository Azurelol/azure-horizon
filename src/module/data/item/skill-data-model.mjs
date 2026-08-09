import SkillAdvancementDataModel from "./fields/skill-advancement-data-model.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import ActiveFeatureDataModel from "./active-feature-data-model.mjs";

/**
 * Skills belong to character classes and are selected and upgraded during a character's advancement
 * @inheritDoc
 * @extends FeatureDataModel
 * @property {String} class The slug of the class this skill belongs to.
 * @property {SkillAdvancementDataModel} advancement
 * @property {CheckDataModel} check
 * @property {DamageDataModel} damage
 * @property {ResourceDataModel} resource
 * @property {EffectsDataModel} effects
 */
export default class SkillDataModel extends ActiveFeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      class: new StringField({
        label: "AH.FIELD.Class",
        _part: "header",
      }),
      advancement: new EmbeddedDataField(SkillAdvancementDataModel, {}),
    });
  }
}
