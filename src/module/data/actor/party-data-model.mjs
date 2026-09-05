import { CodexDataModel } from "../ui/_module.mjs";
import ActorDataModel from "./actor-data-model.mjs";
import AH from "../../config.mjs";

/**
 * @typedef PartyHeroData
 * @property {AHActor} actor
 * @property {String} name
 * @property {Number} level
 */

/**
 * @typedef AdversaryProfileData
 * @property {String} uuid
 * @property {String} name
 * @property {String} img
 * @property {String} rank
 * @property {Number} analysis The analysis level from 1-3.
 */

/**
 * Represents a group of player characters.
 * @property {Set<String>} heroes The uuids of the characters in the party.
 * @property {Set<String>} followers
 * @property {AdversaryProfileData[]} adversaries
 * @property {CodexDataModel} codex
 */
export default class PartyDataModel extends ActorDataModel {
  static defineSchema() {
    const { HTMLField, StringField, SetField, DocumentUUIDField, ObjectField, NumberField, SchemaField, ArrayField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      heroes: new SetField(new DocumentUUIDField({ nullable: true, fieldType: "Actor", config: false })),
      followers: new SetField(new DocumentUUIDField({ nullable: true, fieldType: "Actor", config: false })),
      adversaries: new ArrayField(
        new SchemaField({
          uuid: new DocumentUUIDField({ type: "Actor" }),
          name: new StringField(),
          img: new StringField(),
          rank: new StringField(),
          analysis: new StringField(),
        }),
      ),
      codex: new EmbeddedDataField(CodexDataModel, {}),
      resources: new SchemaField({
        xp: new NumberField({ initial: 0 }),
      }),
    });
  }

  /**
   * @inheritdoc
   * @remarks Forces the data model to be linked
   * */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    this.parent.updateSource({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: true,
        },
      },
    });

    if ((this.parent.type === "party") && !data.permission) {
      this.parent.updateSource({
        ownership: {
          default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
        },
      });
    }
  }

  /**
   * @type {Set<AH_ItemType>}
   */
  static ITEM_TYPES = new Set(["armor", "weapon", "accessory", "consumable"]);

  supportsItemType(type) {
    return PartyDataModel.ITEM_TYPES.has(type);
  }

  /**
   * @param {String} propertyPath
   * @returns {Promise<AHActor[]>}
   */
  async getActors(propertyPath) {
    const actorIds = this[propertyPath];
    let deletedActorIds = [];

    let actors = [];
    for (const id of [...actorIds]) {
      const actor = await fromUuid(id);
      if (!actor) {
        deletedActorIds.push(id);
      }
      actors.push(actor);
    }

    // If any actors were deleted, we must remove them from here as well
    if (deletedActorIds.length > 0) {
      deletedActorIds.forEach((id) => actorIds.delete(id));
      this.parent.update({ [`system.${propertyPath}`]: actorIds });
      actors = actors.filter(Boolean);
    }

    return actors;
  }

  //////////////
  // HEROES
  //------------

  /**
   * @param {AHActor} actor
   * @returns {Promise<void>}
   */
  async addHero(actor) {
    if (actor.type !== "hero") {
      console.warn(`${actor.name} is not a player character!`);
      return;
    }

    const heroes = this.heroes;
    if (heroes.has(actor.uuid)) {
      return;
    }
    heroes.add(actor.uuid);
    await this.parent.update({ ["system.heroes"]: heroes });
    ui.notifications.info(`${actor.name} was added to the party`);
  }

  /**
   * @param {String} id
   */
  removeHero(id) {
    const current = this.heroes;
    current.delete(id);
    this.parent.update({ ["system.heroes"]: current });
    console.debug(`${id} was removed from the party sheet`);
  }

  /**
   *
   * @param {AHActor} actor
   * @returns {PartyHeroData}
   */
  constructHeroData(actor) {
    /** @type CharacterDataModel **/
    const system = actor.system;
    const name = actor.name.split(" ")[0];
    return {
      actor: actor,
      name: name,
    };
  }

  /**
   * @return {Promise<PartyHeroData[]>}
   */
  async getHeroes() {
    const heroes = await this.getActors("heroes");
    return heroes.map((actor) => {
      return this.constructHeroData(actor);
    });
  }

  //////////////
  // ADVERSARIES
  //------------
  /**
   * @param {AHActor} actor
   * @param {Number} increase
   * @returns {Promise<AdversaryProfileData>}
   */
  async addOrUpdateAdversary(actor, increase) {
    // Resolve the source actor uuid
    let uuid = actor.resolveUuid();
    // Already exists, update the current analysis level
    let entry = this.getAdversary(uuid);
    if (entry) {
      const current = entry.analysis;
      if (current !== AH.defaults.analysis.max) {
        entry.study = Math.min(3, current + increase);
        await this.updateAdversary(entry);
      }
      return entry;
    }

    entry = /** @type AdversaryProfileData **/ {
      uuid: uuid,
      name: actor.name,
      img: actor.img,
      rank: actor.system.profile.rank,
    };
    const adversaries = this.adversaries;
    adversaries.push(entry);
    await this.parent.update({ ["system.adversaries"]: adversaries });
    console.debug(`${actor.name} was registered as an adversary`);
    return entry;
  }

  /**
   * @param {AdversaryProfileData} existing
   * @returns {Promise<>} True if it was updated
   */
  async updateAdversary(existing) {
    const adversaries = this.adversaries;
    await this.parent.update({ ["system.adversaries"]: adversaries });
    console.debug(`${existing.name} was updated: ${JSON.stringify(existing)}`);
  }

  /**
   * @param {String} id
   */
  removeAdversary(id) {
    let current = this.adversaries;
    current = current.filter((a) => a.uuid !== id);
    this.parent.update({ ["system.adversaries"]: current });
  }

  /**
   * @param {String} uuid
   * @returns {AdversaryProfileData}
   */
  getAdversary(uuid) {
    return this.adversaries.find((a) => a.uuid === uuid);
  }

  /**
   * @return {Promise<AdversaryProfileData[]>}
   */
  async getAdversaryData() {
    let current = this.adversaries;
    let result = [];
    for (const adversary of current) {
      let percent = Math.round(Math.min(1, adversary.analysis / AH.defaults.analysis.max) * 100);
      result.push({
        ...adversary,
        rank: AH.rank[adversary.rank],
        _rank: adversary.rank,
        studyPercent: percent,
      });
    }

    return result;
  }
}
