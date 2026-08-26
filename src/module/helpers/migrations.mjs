import { ObjectUtils, StringUtils } from "../utils/_module.mjs";
import { CompendiumIndex } from "../data/compendium/_module.mjs";
import Dialogs from "./dialogs.mjs";
import { isCompendiumEntry, isItemType } from "../constants.mjs";

/**
 * @typedef ItemMigrationAction
 * @property {Promise} procedure
 * @property {AHItem} item
 * @property {AHItem} compendiumItem
 */

/**
 * @desc Migrates the data of an item onto another.
 * @param {AHItem|CompendiumIndexEntry} sourceItem
 * @param {AHItem} targetItem
 * @returns {Promise}
 * @async
 */
async function migrateItem(sourceItem, targetItem) {

  // Load the item if it's an entry
  if (isCompendiumEntry(sourceItem)) {
    sourceItem = await fromUuid(sourceItem.uuid);
  }

  // Gather retained data model properties
  const retainedFields = {};
  for (const fieldPath of targetItem.system.retainedFieldPaths) {
    const systemPath = `system.${fieldPath}`;
    const fieldValue = ObjectUtils.getProperty(targetItem, systemPath);
    if (fieldValue !== undefined) {
      retainedFields[systemPath] = fieldValue;
    }
  }

  // Properties
  await targetItem.update(
    {
      name: sourceItem.name,
      img: sourceItem.img,
      system: foundry.utils.deepClone(sourceItem.system),
      flags: foundry.utils.deepClone(sourceItem.flags),
    },
    { diff: false },
  );

  // After the deep clone, apply them again.
  await targetItem.update(retainedFields);

  // Effects
  const updates = [];
  const creates = [];

  const targetEffectsByLabel = new Map(targetItem.effects.map((e) => [e.label, e]));
  for (const sourceEffect of sourceItem.effects) {
    const data = foundry.utils.deepClone(sourceEffect.toObject());

    // Never reuse IDs or origins
    delete data._id;
    delete data.origin;

    const targetEffect = targetEffectsByLabel.get(sourceEffect.label);
    if (targetEffect) {
      updates.push({
        _id: targetEffect.id,
        changes: data.changes,
        duration: data.duration,
        flags: data.flags,
        disabled: data.disabled,
        system: foundry.utils.deepClone(sourceEffect.system),
      });
    } else {
      creates.push(data);
    }
  }

  if (updates.length) {
    await targetItem.updateEmbeddedDocuments("ActiveEffect", updates);
  }

  if (creates.length) {
    await targetItem.createEmbeddedDocuments("ActiveEffect", creates);
  }
}

/**
 * @param {AHItem|CompendiumIndexEntry} sourceItem
 * @param {AHItem} targetItem
 * @returns {{item, compendiumItem, procedure: ((function(): Promise<void>)|*)}}
 */
function constructAction(sourceItem, targetItem) {
  const procedure = async () => {
    await migrateItem(sourceItem, targetItem);
  };
  return {
    item: targetItem,
    compendiumItem: sourceItem,
    procedure,
  };
}

/**
 * @param {AHItem[]} items
 * @returns {Promise<ItemMigrationAction[]>}
 */
async function getItemMigrationActions(items) {
  /** @type ItemMigrationAction[] **/
  const updates = [];
  for (const item of items) {
    if (item.system.slug && (item.system.slug !== "")) {
      const compendiumEntry = await CompendiumIndex.instance.getItemBySlug(item.system.slug);
      if (!compendiumEntry) {
        continue;
      }
      const compendiumItem = await fromUuid(compendiumEntry.uuid);
      if (!compendiumItem) {
        continue;
      }
      updates.push(constructAction(compendiumItem, item));

    }
  }
  return updates;
}

/**
 * @typedef PromptMigrationOptions
 * @property {Boolean} showActor
 */

/**
 * @param {String} messageStr
 * @param {ItemMigrationAction[]} updates
 * @param {PromptMigrationOptions} options
 * @return {Promise}
 */
async function promptMigration(messageStr, updates, options = {}) {
  if (updates.length > 0) {
    const message = StringUtils.localize(messageStr, {
      count: updates.length,
    });

    const items = updates.map((upd) => upd.item);
    const compendiumItems = updates.map((upd) => upd.compendiumItem);

    const title = "AH.COMMON.MigrateItems";
    /** @type ItemSelectionData **/
    const data = {
      title: title,
      message,
      options: options,
      style: "list",
      items: items,
      compendiumItems: compendiumItems,
      getDescription: async (item) => {
        return item.system?.description ?? "";
      },
    };

    const result = await Dialogs.itemSelect(data);
    if (result && (result.length > 0)) {
      const uuids = new Set(result.map((item) => item.uuid));
      const selectedUpdates = updates.filter((u) => uuids.has(u.item.uuid)).map((u) => u.procedure);
      await Promise.all(selectedUpdates.map((fn) => fn()));
      ui.notifications.info(StringUtils.localize("AH.DIALOG.CompendiumMigrateSuccess", { count: selectedUpdates.length }));
    }
  }
}

/**
 * Prompts a migration action for all items in the actor that come from a compendium entry.
 * @param {AHActor} actor
 * @returns {Promise<void>}
 */
async function migrateItems(actor) {
  /** @type AHItem[] **/
  let items = Array.from(actor.items.values()).sort((a, b) => a.name.localeCompare(b.name));

  /** @type ItemMigrationAction[] **/
  const updates = await getItemMigrationActions(items);
  return promptMigration("AH.DIALOG.CompendiumMigrateActorItemsMessage", updates);
}

/**
 * Prompts a migration action for all the actor that comes from an adversary compendium entry.
 * @param {AHActor} actor
 * @returns {Promise<void>}
 */
async function migrateActor(actor) {
}

/**
 * Finds all items across the world, all actors, and all Item compendiums that share the given slug.
 * @param {string} slug
 * @returns {Promise<AHItem[]>}
 */
async function findItemsBySlug(slug) {
  const matches = [];

  // World items
  for (const item of game.items) {
    if (item.system.slug === slug) matches.push(item);
  }

  // Actor-owned items
  for (const actor of game.actors) {
    for (const item of actor.items) {
      if (item.system.slug === slug) matches.push(item);
    }
  }

  // Compendium-Actor items
  const actorEntries = await CompendiumIndex.instance.getActorEntries("adversary");
  /** @type CompendiumIndexEntry[] **/
  const actors = [...actorEntries.adversary, ...actorEntries.follower];

  for (const entry of actors) {
    /** @type AHActor **/
    const actor = await fromUuid(entry.uuid);
    for (const item of actor.items) {
      if (item.system.slug === slug) matches.push(item);
    }
  }

  return matches;
}

/**
 * Pushes an update to all items that share this one's slug.
 * @param {AHItem} sourceItem
 * @returns {Promise<ItemMigrationAction[]>}
 */
async function getItemUpdates(sourceItem) {
  const items = await findItemsBySlug(sourceItem.system.slug);

  /** @type ItemMigrationAction[] **/
  const updates = [];

  for (const item of items) {
    const procedure = async () => {
      await migrateItem(sourceItem, item);
    };
    updates.push({
      item: item,
      compendiumItem: sourceItem,
      procedure,
    });
  }

  return updates;
}

/**
 * Pushes an update to all items that share this one's slug.
 * @param {AHItem} item
 * @returns {Promise<void>}
 */
async function pushItemUpdate(item) {
  const updates = await getItemUpdates(item);
  return promptMigration("AH.DIALOG.CompendiumPushItemUpdate", updates, {
    showActor: true,
  });
}

/**
 * Pulls an update from the source compendium item if possible.
 * @param {AHItem} item
 * @returns {Promise<void>}
 */
async function pullItemUpdate(item) {
  const sourceItem = await CompendiumIndex.instance.getItemBySlug(item.system.slug);
  if (sourceItem) {
    const updates = [constructAction(sourceItem, item)];
    return promptMigration("AH.DIALOG.CompendiumPullItemUpdate", updates);
  }
}

const Migrations = Object.freeze({
  migrateItems,
  migrateActor,

  findItemsBySlug,
  pushItemUpdate,
  pullItemUpdate,
});

export default Migrations;
