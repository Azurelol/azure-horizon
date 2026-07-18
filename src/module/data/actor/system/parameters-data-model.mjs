import { VersionedDataModel } from "../../api/_module.mjs";

export default class ParametersDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {

    });
  }
}
