import { VersionedDataModel } from "../api/_module.mjs";

const fields = foundry.data.fields;

/**
 * A base item model that provides basic description and source metadata for an item instance.
 * @property {String} schemaVersion The data model version.
 * @property {String} revision The published revision of this item. Used to detect and prompt updates when newer errata versions are available.
 * @property {String} slug An unique human-readable identifier, used to reference the item programmatically.
 */
export default class BaseItemModel extends VersionedDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      revision: new fields.NumberField({
        required: true,
        nullable: false,
        initial: 1,
        label: "AH.Item.Revision",
        integer: true,
      }),
      slug: new fields.StringField({
        required: false,
        blank: true,
        initial: "",
        label: "AH.Item.Slug",
        validate: (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      }),
    });
  }
}
