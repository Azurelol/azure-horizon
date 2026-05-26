import { BaseActorModel } from "./_module.mjs";

export default class CharacterModel extends BaseActorModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {});
  }
}
