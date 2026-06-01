import { ActorDataModel } from "./_module.mjs";

export default class UnitDataModel extends ActorDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
  }
}
