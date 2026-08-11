import { VersionedDataModel } from "../../api/_module.mjs";

export default class ProfileDataModel extends VersionedDataModel {
  static defineSchema() {
    const { SchemaField, StringField, NumberField, HTMLField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }
}
