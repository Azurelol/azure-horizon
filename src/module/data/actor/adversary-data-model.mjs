import BaseCharacterDataModel from "./base-character-data-model.mjs";

export default class AdversaryDataModel extends BaseCharacterDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
  }
}
