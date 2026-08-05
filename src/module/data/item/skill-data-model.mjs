import FeatureDataModel from "./feature-data-model.mjs";
import { systemTemplatePath } from '../../constants.mjs';
import SkillAdvancementDataModel from './fields/skill-advancement-data-model.mjs';

/**
 * Skills belong to character classes and are selected and upgraded during a character's advancement
 * @inheritDoc
 * @extends FeatureDataModel
 * @property {SkillAdvancementDataModel} advancement
 */
export default class SkillDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      advancement: new EmbeddedDataField(SkillAdvancementDataModel, {})
    });
  }


}
