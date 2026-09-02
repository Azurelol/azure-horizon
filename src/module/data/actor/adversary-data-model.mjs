import CharacterDataModel, {
  CharacterResourcesDataModel,
} from "./character-data-model.mjs";
import { CharacterParametersDataModel } from "./character-parameters-data-model.mjs";
import { ActorResourceDataModel, AdversaryProfileDataModel } from "./system/_module.mjs";
import { ObjectUtils } from "../../utils/_module.mjs";
import Assembly from "../../ruleset/assembly.mjs";
import { TraitsField } from "../item/fields/_module.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import { VersionedDataModel } from "../api/_module.mjs";

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
 * Represents pressure on a higher rank adversary.
 * @property {Number} value
 * @property {Number} max
 */
class PressureDataModel extends VersionedDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      value: new NumberField({ initial: 0, min: 0, integer: true, nullable: false }),
      max: new NumberField({ initial: 4 }),
    });
  }

  /**
   * @returns {boolean}
   */
  get full() {
    return this.value === this.max;
  }
}

/**
 * @property {ParameterDataModel} def
 * @property {ParameterDataModel} mdef
 * @property {PressureDataModel} pressure
 */
class AdversaryParametersDataModel extends CharacterParametersDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      pressure: new EmbeddedDataField(PressureDataModel, {}),
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
      parameters: new EmbeddedDataField(AdversaryParametersDataModel, {}),
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
 * @typedef AdversaryAssemblyFields
 * @property {AH_RoleType} role
 * @property {Number} level
 * @property {AH_Rank} rank
 */

/**
 * Applies the role's attributes and adjustments to the adversary.
 * @param {AHActor} actor
 * @param {AdversaryAssemblyFields} fields
 * @returns
 */
async function assemble(actor, fields) {
  /** @type AH_RoleType **/
  const role = fields.role ?? actor.system.role;
  if (role === "custom") {
    return;
  }

  const level = fields.level ?? actor.system.level;
  const updates = {};

  // Update turns based on rank
  if (fields.rank) {
    let turns = 1;
    switch (fields.rank) {
      case "minion":
        turns = 0;
        break;
      case "standard":
        turns = 1;
        break;
      case "elite":
        turns = 2;
        break;
      case "champion":
        turns = 4;
        break;
    }
    updates["system.profile.turns"] = turns;
  }

  const assembly = Assembly.resolve(role, level);
  if (assembly) {
    // 1. Apply check and damage bonuses based on level ??
    // 2. Apply attribute array based on role (except baseline)
    updates["system.attributes.mig.base"] = assembly.attributes.mig;
    updates["system.attributes.dex.base"] = assembly.attributes.dex;
    updates["system.attributes.ins.base"] = assembly.attributes.ins;
    updates["system.attributes.wlp.base"] = assembly.attributes.wlp;
  }

  if (Object.keys(updates).length > 0) {
    actor.update(updates);
  }
}

Hooks.on("preUpdateActor", async (document, changed) => {
  if (document.system instanceof AdversaryDataModel) {

    // If rank changed
    const newRank = ObjectUtils.getProperty(changed, "system.profile.rank");
    if (newRank) {
      assemble(document, { rank: newRank });
      return;
    }

    // If role or level changed
    const newRole = ObjectUtils.getProperty(changed, "system.profile.role");
    let roleChanged = (newRole !== undefined) && (newRole !== document.system.role);
    const newLevel = ObjectUtils.getProperty(changed, "system.level");
    let levelChanged = (newLevel !== undefined) && (newLevel !== document.system.level);
    if (roleChanged || levelChanged) {
      assemble(document, {
        role: newRole,
        level: newLevel,
      });
    }
  }
});
