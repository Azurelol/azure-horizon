import CharacterDataModel, {
  CharacterResourcesDataModel,
} from "./character-data-model.mjs";
import { CharacterParametersDataModel } from "./character-parameters-data-model.mjs";
import { ActorResourceDataModel, AdversaryProfileDataModel } from "./system/_module.mjs";
import { ObjectUtils } from "../../utils/_module.mjs";
import Assembly from "../../ruleset/assembly.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

/**
 * @property {ActorResourceDataModel} hp
 * @property {ActorResourceDataModel} mp
 */
class AdversaryResourcesDataModel extends CharacterResourcesDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      ip: new EmbeddedDataField(ActorResourceDataModel, {}),
      tp: new EmbeddedDataField(ActorResourceDataModel, {}),
    });
  }
}

/**
 * Represents the data of an adversary in combat.
 * @property {CharacterParametersDataModel} parameters
 * @property {AdversaryResourcesDataModel} resources
 * @property {AdversaryProfileDataModel} profile
 */
export default class AdversaryDataModel extends CharacterDataModel {

  /**
   * @type {Set<AH_ItemType>}
   */
  static ITEM_TYPES = new Set(["attack", "ability"]);

  static defineSchema() {
    const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      parameters: new EmbeddedDataField(CharacterParametersDataModel, {}),
      resources: new EmbeddedDataField(AdversaryResourcesDataModel, {}),
      profile: new EmbeddedDataField(AdversaryProfileDataModel, {}),
    });
  }

  supportsItemType(type) {
    return AdversaryDataModel.ITEM_TYPES.has(type);
  }

  /**
   * @override
   */
  prepareBaseData() {
    super.prepareBaseData();
    switch (this.profile.rank) {
      case "minion":
        this.profile.turns = 0;
        break;
      case "standard":
        this.profile.turns = 1;
        break;
      case "elite":
        this.profile.turns = 2;
        break;
      case "champion":
        break;
    }
  }

  _prepareParameters() {
    super._prepareParameters();
    // Let's add adversary affinities when they are present
  }

  /**
   * @returns {boolean} If this adversary is being automatically assembled.
   */
  get assembled() {
    return this.profile.role !== "custom";
  }
}

/**
 * Applies the role's attributes and adjustments to the adversary.
 * @param {AHActor} actor
 * @param {AH_RoleType} newRole
 * @param {Number} newLevel
 * @returns
 */
async function assemble(actor, newRole, newLevel) {
  /** @type AH_RoleType **/
  const role = newRole ?? actor.system.role;
  if (role === "custom") {
    return;
  }

  const level = newLevel ?? actor.system.level;
  const updates = {};

  const assembly = Assembly.resolve(role, level);
  if (!assembly) {
    return;
  }

  // 1. Apply check and damage bonuses based on level ??
  // 2. Apply attribute array based on role (except baseline)
  updates["system.attributes.mig.base"] = assembly.attributes.mig;
  updates["system.attributes.dex.base"] = assembly.attributes.dex;
  updates["system.attributes.ins.base"] = assembly.attributes.ins;
  updates["system.attributes.wlp.base"] = assembly.attributes.wlp;

  if (Object.keys(updates).length > 0) {
    actor.update(updates);
  }
}

Hooks.on("preUpdateActor", async (document, changed) => {
  if (document.system instanceof AdversaryDataModel) {

    // If rank changed
    const newRank = ObjectUtils.getProperty(changed, "system.rank");
    if (newRank) {
      assemble(document, document.system.role, undefined);
      return;
    }

    // If role or level changed
    const newRole = ObjectUtils.getProperty(changed, "system.profile.role");
    let roleChanged = (newRole !== undefined) && (newRole !== document.system.role);
    const newLevel = ObjectUtils.getProperty(changed, "system.level");
    let levelChanged = (newLevel !== undefined) && (newLevel !== document.system.level);
    if (roleChanged || levelChanged) {
      assemble(document, newRole, newLevel);
    }
  }
});
