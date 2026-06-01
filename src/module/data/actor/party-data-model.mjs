import { ActorDataModel } from "./_module.mjs";
import { CodexDataModel } from "../ui/_module.mjs";

/**
 * @typedef PartyCharacterData
 * @property {AHActor} actor
 * @property {String} name
 * @property {Number} level
 */

/**
 * Represents a group of player characters.
 * @property {Set<String>} characters The uuids of the characters in the party.
 * @property {CodexDataModel} codex
 */
export default class PartyDataModel extends ActorDataModel {
  static defineSchema() {
    const { HTMLField, StringField, SetField, DocumentUUIDField, ObjectField, NumberField, SchemaField, ArrayField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      characters: new SetField(new DocumentUUIDField({ nullable: true, fieldType: "Actor", config: false })),
      codex: new EmbeddedDataField(CodexDataModel, {}),
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

  /**
   * @param {AHActor} actor
   * @returns {Promise<void>}
   */
  async addCharacter(actor) {
    if (actor.type !== "character") {
      console.warn(`${actor.name} is not a player character!`);
      return;
    }

    const characters = this.characters;
    if (characters.has(actor.uuid)) {
      return;
    }
    characters.add(actor.uuid);
    await this.parent.update({ ["system.characters"]: characters });
    ui.notifications.info(`${actor.name} was added to the party`);
  }

  /**
   * @param {String} id
   */
  removeCharacter(id) {
    const current = this.characters;
    current.delete(id);
    this.parent.update({ ["system.characters"]: current });
    console.debug(`${id} was removed from the party sheet`);
  }

  /**
   *
   * @param {AHActor} actor
   * @returns {PartyCharacterData}
   */
  constructCharacterData(actor) {
    /** @type CharacterDataModel **/
    const system = actor.system;
    const name = actor.name.split(" ")[0];
    return {
      actor: actor,
      name: name,
    };
  }

  /**
   * @return {Promise<PartyCharacterData[]>}
   */
  async getCharacters() {
    const characters = await this.getActors("characters");
    return characters.map((actor) => {
      return this.constructCharacterData(actor);
    });
  }
}
