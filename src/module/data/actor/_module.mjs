import ActorDataModel from "./actor-data-model.mjs";
import CharacterData from "./character-data.mjs";
import NPCModel from "./npc-model.mjs";
import PartyData from "./party-data.mjs";

const dataModels = Object.freeze({
  base: ActorDataModel,
  character: CharacterData,
  party: PartyData,
  npc: NPCModel,
});

export { ActorDataModel, dataModels };
