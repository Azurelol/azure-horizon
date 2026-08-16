import { VersionedDataModel } from "../../api/_module.mjs";

/**
 * Describes the character's fiction, role in the story.
 * @property {String} summary
 */
export default class FollowerProfileDataModel extends VersionedDataModel {
  static defineSchema() {
    const { SchemaField, StringField, NumberField, HTMLField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      summary: new HTMLField(),
    });
  }
}
