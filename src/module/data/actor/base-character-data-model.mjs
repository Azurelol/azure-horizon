import { ActorDataModel } from "./_module.mjs";

export default class BaseCharacterDataModel extends ActorDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
  }
}
