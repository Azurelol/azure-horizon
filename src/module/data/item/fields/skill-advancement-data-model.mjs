import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";

/**
 * @property {Number} level.current The current skill level
 * @property {Number} level.max The maximum skill level
 * @property {AH_Slug} class The slug of the class this belongs to. Used for indexing.
 */
export default class SkillAdvancementDataModel extends FieldsetDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      level: new SchemaField({
        current: new NumberField({ initial: 1, min: 1, integer: true, nullable: false }),
        max: new NumberField({ initial: 1, min: 1, integer: true, nullable: false }),
      }),
      class: new StringField(),
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/skill-advancement-data-model");
  }
}
