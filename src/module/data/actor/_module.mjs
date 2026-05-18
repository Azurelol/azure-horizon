import BaseActorModel from "./base-actor-model.mjs";
import CharacterModel from "./character-model.mjs";
import NPCModel from "./npc-model.mjs";
import PartyModel from "./party-model.mjs";

const dataModels = Object.freeze({
  base: BaseActorModel,
  character: CharacterModel,
  party: PartyModel,
  npc: NPCModel,
});

export { BaseActorModel, dataModels };
