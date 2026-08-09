import FeatureDataModel from "./feature-data-model.mjs";
import SkillAdvancementDataModel from "./fields/skill-advancement-data-model.mjs";
import { DamageDataModel } from "./fields/_module.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";

/**
 * Skills belong to character classes and are selected and upgraded during a character's advancement
 * @inheritDoc
 * @extends FeatureDataModel
 * @property {String} class he slug of the class this skill belongs to.
 * @property {SkillAdvancementDataModel} advancement
 * @property {DamageDataModel} damage
 * @property {EffectsDataModel} effects
 *
 */
export default class SkillDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      class: new StringField({
        label: "AH.FIELD.Class",
      }),
      advancement: new EmbeddedDataField(SkillAdvancementDataModel, {}),
      effects: new EmbeddedDataField(EffectsDataModel, {}),
      damage: new EmbeddedDataField(DamageDataModel, FoundryUtils.configureInitial(DamageDataModel, {
        enabled: true,
      })),
    });
  }
}
