import ActorDataModel from "./actor-data-model.mjs";
import CharacterDataModel from "./character-data-model.mjs";
import AdversaryDataModel from "./adversary-data-model.mjs";
import PartyDataModel from "./party-data-model.mjs";
import UnitDataModel from "./unit-data-model.mjs";

/**
 * @typedef {"character"|"party"|"adversary"|"unit"} AHActorType
 */

const dataModels = Object.freeze({
  base: ActorDataModel,
  character: CharacterDataModel,
  party: PartyDataModel,
  adversary: AdversaryDataModel,
  unit: UnitDataModel,
});

export { ActorDataModel, dataModels };
