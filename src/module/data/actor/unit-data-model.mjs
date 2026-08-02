import ActorDataModel from "./actor-data-model.mjs";

export default class UnitDataModel extends ActorDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
  }
}
