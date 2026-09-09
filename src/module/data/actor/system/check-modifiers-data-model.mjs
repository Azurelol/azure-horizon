import { ModifiersDataModel, VersionedDataModel } from "../../api/_module.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

export default class CheckModifiersDataModel extends VersionedDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      all: new EmbeddedDataField(ModifiersDataModel),
    });
  }
}
