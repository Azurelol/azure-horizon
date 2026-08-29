import ActorDataModel from "./actor-data-model.mjs";
import HeroDataModel from "./hero-data-model.mjs";
import AdversaryDataModel from "./adversary-data-model.mjs";
import PartyDataModel from "./party-data-model.mjs";
import UnitDataModel from "./unit-data-model.mjs";
import FollowerDataModel from "./follower-data-model.mjs";
import EntityDataModel from "./entity-data-model.mjs";

const dataModels = Object.freeze({
  base: ActorDataModel,

  hero: HeroDataModel,
  party: PartyDataModel,
  adversary: AdversaryDataModel,
  follower: FollowerDataModel,
  entity: EntityDataModel,

  unit: UnitDataModel,
});

export { ActorDataModel, dataModels };
