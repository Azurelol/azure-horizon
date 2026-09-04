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
import { Formulas } from "../../ruleset/_module.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

/**
 * @property {ActorResourceDataModel} hp
 * @property {ActorResourceDataModel} mp
 * @property {ActorResourceDataModel} pp
 */
class AdversaryResourcesDataModel extends CharacterResourcesDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      ip: new EmbeddedDataField(ActorResourceDataModel, {}),
      tp: new EmbeddedDataField(ActorResourceDataModel, {}),
      pp: new EmbeddedDataField(ActorResourceDataModel, {}),
    });
  }
}

/**
 * @property {ParameterDataModel} def
 * @property {ParameterDataModel} mdef
 */
class AdversaryParametersDataModel extends CharacterParametersDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
    });
  }
}

/**
 * Represents the data of an adversary in combat.
 * @property {CharacterParametersDataModel} parameters
 * @property {AdversaryResourcesDataModel} resources
 * @property {AdversaryProfileDataModel} profile
 * @property {String} assembly.attack The adversary's main attack, assigned for abilities that use it.
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
      assembly: new SchemaField({
        attack: new StringField({ nullable: true }),
      }),
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

  _prepareResources() {
    super._prepareResources();
    this.resources.pp.defineMaximumProperty(() => Formulas.calculatePressurePoints(this));
  }

  _prepareParameters() {
    super._prepareParameters();
    this.addTracker("pressure", "pressure");
  }

  /**
   * @returns {boolean} If this adversary is being automatically assembled.
   */
  get assembled() {
    return this.profile.role !== "custom";
  }

  /**
   * @returns {boolean} True if the rank is elite or above
   */
  get ranked() {
    return (this.profile.rank === "elite") || (this.profile.rank === "champion");
  }

  /**
   * @param {AHItem} item
   */
  async setAttack(item) {
    const data = {
      ...this.assembly,
    };
    if (data.attack === item.id) {
      data.attack = null;
    } else {
      data.attack = item.id;
    }
    await this.parent.update({ "system.assembly": data });
  }

  /**
   * @return {AHItem}
   */
  getAttack() {
    if (this.assembly.attack) {
      return this.parent.items.get(this.assembly.attack);
    }
    return undefined;
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
  let turns;

  // Update turns based on rank
  if (fields.rank) {
    turns = 1;
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

  // Update hp
  updates["system.resources.hp.value"] = Formulas.calculateHitPoints(actor.system, {
    level: level,
    turns: turns,
  });

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
