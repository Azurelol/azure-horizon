import { VersionedDataModel } from "../api/_module.mjs";

const fields = foundry.data.fields;

/**
 * A base item model that provides basic description and source metadata for an item instance.
 * @property {String} schemaVersion The data model version.
 * @property {String} revision The published revision of this item. Used to detect and prompt updates when newer errata versions are available.
 * @property {String} slug An unique human-readable identifier, used to reference the item programmatically.
 */
export default class ItemDataModel extends VersionedDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, HTMLField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      revision: new NumberField({
        required: true,
        nullable: false,
        initial: 1,
        label: "AH.ITEM.Revision",
        integer: true,
        config: false,
      }),
      slug: new StringField({
        required: false,
        blank: true,
        initial: "",
        config: false,
        label: "AH.ITEM.Slug",
        validate: (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      }),
      description: new HTMLField({
        label: "AH.ITEM.Description",
      }),
    });
  }

  /**
   * Entry point for item-specific actions.
   * @param {KeyboardModifiers} modifiers
   * @returns {Promise<boolean>} True if an action was performed.
   */
  async perform(modifiers) {
    return false;
  }

  
}
