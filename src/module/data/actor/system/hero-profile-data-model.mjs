import { VersionedDataModel } from "../../api/_module.mjs";

/**
 * Describes the character's fiction, role in the story.
 * @property {String} identity  How the character sees themselves.
 * @property {String} theme Why the character fights.
 * @property {String} origin Where the character comes from.
 * @property {String} anchor What the character cannot bear to lose. Their emotional anchor.
 * @property {String} title What the world knows the character for. Unlocked during promotion.
 */
export default class HeroProfileDataModel extends VersionedDataModel {
  static defineSchema() {
    const { SchemaField, StringField, NumberField, HTMLField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      identity: new StringField(),
      theme: new StringField(),
      origin: new StringField(),
      anchor: new StringField(),
      title: new StringField(),
      summary: new HTMLField(),
    });
  }
}
