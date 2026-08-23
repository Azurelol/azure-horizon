import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";

/**
 * Handles the management of engrams in an accessory.
 */
export default class EngramSlotsDataModel extends FieldsetDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/engram-slots-data-model");
  }
}
