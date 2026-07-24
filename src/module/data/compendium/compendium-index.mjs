/**
 * @typedef CompendiumIndexEntry
 * @property {string} _id            Document ID within the compendium
 * @property {string} uuid           Fully-qualified UUID
 * @property {string} name           Document name
 * @property {string|null} img       Image path
 * @property {string} type           Document subtype
 * @property {string} pack           Compendium collection key (e.g. "fu.items")
 * @property {Object} [system]       Partial system data (indexed fields only)
 * @property {Object} metadata       Additional metadata patched by the compendium index.
 */

/**
 * @typedef CompendiumSourceInfo
 * @property {String} id The package id.
 * @property {'system'|'module'|'world'}  type
 * @property {String} title Human readable name.
 */

/**
 * @typedef AH_ClassReference
 * @desc The reference to a character class in this system.
 * @property {String} name The localized name.
 * @property {String} slug
 * @property {String} img
 */

/**
 * @typedef AH_EquipmentEntries
 * @property {CompendiumIndexEntry[]} weapon
 */

/**
 * @typedef AH_ActorEntries
 * @property {CompendiumIndexEntry[]} character
 * @property {CompendiumIndexEntry[]} adversary
 */

import { StringUtils } from "../../utils/_module.mjs";
import { systemID } from "../../constants.mjs";

/**
 * @desc Handles indexing of system-specific documents.
 */
export default class CompendiumIndex {
  /**
	 * The current compendium index.
	 * @type {CompendiumIndex}
	 */
  static #instance;

  /**
	 * @returns {CompendiumIndex}
	 */
  static get instance() {
    if (!CompendiumIndex.#instance) {
      CompendiumIndex.#instance = new CompendiumIndex();
    }
    return CompendiumIndex.#instance;
  }

  /**
	 * @desc Forces the index to be reinitialized.
	 */
  static reinitialize() {
    CompendiumIndex.#instance = undefined;
  }

  /**
	 * @desc Where the keys are the item types.
	 * @type {Record<string, CompendiumIndexEntry[]>}
	 */
  #itemsByType;

  /**
	 * @desc All compendium items by their slug.
	 @type {Record<string, CompendiumIndexEntry>}
	 */
  #itemsBySlug;

  /**
	 * @desc All compendium items by their slug.
	 @type {CompendiumIndexEntry[]}
	 */
  #effects;

  /**
	 * @desc Where the keys are the actor types.
	 * @type {Record<string, CompendiumIndexEntry[]>}
	 */
  #actorsByType;

  /**
   * List of all effects by their slug.
   */
  #effectIdList;

  /**
	 * @remarks slug : Image Source Path
	 * @type {Record<AH_ClassReference[]>}
	 */
  #classReferences;

  // Actors
  static npcFields = Object.freeze({
    species: "system.species.value",
    rank: "system.rank.value",
    role: "system.role.value",
  });

  /**
   * Actor specific data model fields to be indexed.
   * @type {Readonly<{[p: string]: *}>}
   */
  static actorFields = Object.freeze({
    ...CompendiumIndex.npcFields,
  });

  /**
	 * Item specific data model fields to be indexed.
	 * @returns {Record<string, string>}
	 */
  static itemFields = Object.freeze({
    slug: "system.slug",
  });

  /**
	 * @param {Boolean} force
	 * @returns {Promise<Record<string, CompendiumIndexEntry[]>>}
	 */
  async getItems(force = false) {
    if (!this.#itemsByType || force) {
      this.#itemsByType = await this.getEntries("Item", null, Object.values(CompendiumIndex.itemFields));
    }
    return this.#itemsByType;
  }

  /**
	 * @param {String} slug An unique identifier used by the system.
	 * @returns {Promise<CompendiumIndexEntry>} A compendium index entry.
	 */
  async getItemsBySlug(slug) {
    if (!this.#itemsBySlug) {
      this.#itemsBySlug = {};
      const itemGroups = await this.getItems();
      const itemEntries = Object.values(itemGroups).flat();
      for (const item of itemEntries) {
        const slug = item.system.slug;
        if (slug) {
          this.#itemsBySlug[slug] = item;
        }
      }
    }

    return this.#itemsBySlug[slug] ?? null;
  }

  /**
	 *
	 * @param {String} type The item type.
	 * @param {Boolean} force
	 * @returns {Promise<CompendiumIndexEntry[]>}
	 */
  async getItemsOfType(type, force = false) {
    const entries = await this.getItems(force);
    if (entries[type]) {
      return entries[type];
    }
    return [];
  }

  /**
	 * @param {Boolean} force
	 * @returns {Promise<Record<string, CompendiumIndexEntry[]>>}
	 */
  async getActors(force) {
    if (!this.#actorsByType || force) {
      this.#actorsByType = await this.getEntries("Actor", null, Object.values(CompendiumIndex.actorFields));
    }
    return this.#actorsByType;
  }

  /**
	 *
	 * @param {String} type The actor type.
	 * @param {Boolean} force
	 * @returns {Promise<CompendiumIndexEntry[]>}
	 */
  async getActorsOfType(type, force = false) {
    const entries = await this.getActors(force);
    if (entries[type]) {
      return entries[type];
    }
    return [];
  }

  /**
	 * @desc Returns all indexed effect items, which are containers of effects.
	 * @returns {Promise<CompendiumIndexEntry[]>}
	 */
  async getEffects() {
    if (!this.#effects) {
      this.#effects = await this.getItemsOfType("effect");
    }
    return this.#effects;
  }

  /**
	 * @desc Returns the slugs of all indexed effect items.
	 * @returns {Promise<String[]>}
	 */
  async getEffectIdList() {
    if (!this.#effectIdList) {
      const effects = await this.getEffects();
      let result = new Set();
      for (const effect of effects) {
        const slug = effect.system.slug;
        if (slug) {
          result.add(slug);
        }
      }
      this.#effectIdList = Array.from(result);
    }
    return this.#effectIdList;
  }

  /**
	 * @returns {Promise<AH_ClassReference[]>}
	 */
  async getClassReferences() {
    if (!this.#classReferences) {
      const classInfo = await this.getClassEntries();
      const refMap = new Map();

      for (const entry of classInfo.class) {
        const slug = entry.system.slug;
        if (slug && !refMap.has(slug)) {
          refMap.set(slug, { name: entry.name, slug, img: entry.img });
        }
      }

      this.#classReferences = Array.from(refMap.values());
    }
    return this.#classReferences;
  }

  /**
	 * @param {AHItem|CompendiumIndexEntry} document The entry or item that is referencing the class it's associated to.
	 * @returns {String[]} The classes being referenced by the entry, which can be comma-separated.
	 */
  static getClassRequirements(document) {
    if (document.system?.class?.value) {
      let classes = document.system.class.value.split(",");
      classes = classes.map((c) => {
        return StringUtils.titleToKebab(c.trim());
      });
      return classes;
    }
    return [];
  }

  /**
	 * @param {String} type type of document.
	 * @returns {[]}
	 */
  getSystemPacks(type) {
    return game.packs.filter((p) => (p.documentName === type) && p.metadata.packageName.startsWith(systemID));
  }

  /**
	 * @param {String} type type of document.
	 * @returns {[]}
	 */
  getPacks(type) {
    // TODO: System setting?
    const compendiumBrowserPacks = "system";
    const setting = game.settings.get(systemID, compendiumBrowserPacks);
    return game.packs.filter((p) => {
      const isSystemPack = p.collection.startsWith(`${systemID}.`);
      switch (setting) {
        case "system":
          if (!isSystemPack) {
            return false;
          }
          break;
        case "custom":
          if (isSystemPack) {
            return false;
          }
          break;
      }
      return p.documentName === type;
    });
  }

  /**
	 * @returns {CompendiumSourceInfo[]}
	 */
  getLoadedCompendiumSourceInfo() {
    const sources = new Map();

    for (const pack of game.packs) {
      const pkg = pack.metadata.packageName;
      if (!pkg || sources.has(pkg)) continue;
      if (pack.metadata.system !== systemID) continue;

      // World packs
      if (pkg === "world") {
        sources.set(pkg, {
          id: "world",
          type: "world",
          title: game.world.title,
        });
        continue;
      }

      // System packs
      if (pkg === game.system.id) {
        sources.set(pkg, {
          id: pkg,
          type: "system",
          title: game.system.title,
        });
        continue;
      }

      // Module packs
      const module = game.modules.get(pkg);
      if (module) {
        sources.set(pkg, {
          id: pkg,
          type: "module",
          title: module.title,
        });
      }
    }

    return [...sources.values()];
  }

  /**
	 * @param {string} document Document type (e.g. "Item")
	 * @param {string} type The document subtype. (Such as what type of items like armor, weapons)
	 * @param {string[]} fields The fields to record
	 * @returns {Promise<Record<string, CompendiumIndexEntry[]>>}
	 */
  async getEntries(document, type, fields = []) {
    console.debug(`Fetching entries for document: ${document}`);

    /** @type {Record<string, CompendiumIndexEntry[]>} */
    const result = {};
    const packs = this.getPacks(document);

    const indexes = await Promise.all(
      packs.map((pack) => {
        return pack
          .getIndex({
            fields: ["name", "img", "type"].concat(fields),
          })
          .then((entries) => ({ pack, entries }));
      }),
    );

    for (const { pack, entries } of indexes) {
      for (const entry of entries) {
        const key = entry.type ?? "unknown";
        if (type && (key !== type)) continue;

        this.patchEntryData(entry);

        (result[key] ??= []).push({
          ...entry,
          pack: pack.collection,
          packageName: pack.metadata.packageName,
        });
      }
    }

    return result;
  }

  /**
	 * @desc Adds extra data to entries of specific data models to help with indexing.
	 * @param {CompendiumIndexEntry} entry
	 * @returns {*}
	 */
  patchEntryData(entry) {
    // TODO: Use when indexing won't make it
    entry.metadata = {
    };
    return entry;
  }

  /**
	 * @returns {Promise<AH_EquipmentEntries>}
	 */
  async getEquipmenEntries() {
    const entries = {
      weapon: await this.getItemsOfType("weapon"),
    };
    return entries;
  }

  /**
	 * @returns {Promise<CompendiumIndexEntry[]>}
	 */
  async getClassEntries() {
    let classes = await this.getItemsOfType("class");

    const entries = {
      class: classes,
    };
    return entries;
  }

  /**
	 * @returns {Promise<AH_ActorEntries>}
	 */
  async getActorEntries() {
    const entries = {
      character: await this.getActorsOfType("character"),
      npc: await this.getActorsOfType("adversary"),
    };
    return entries;
  }

  /**
	 * @desc Subscribes to various callbacks for indexing.
	 */
  static initialize() {
    Hooks.on("updateCompendium", async (pack, changes) => {
      CompendiumIndex.reinitialize();
    });
  }
}
