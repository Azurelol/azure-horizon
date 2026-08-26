import { ObjectUtils, StringUtils } from "../utils/_module.mjs";
import { CompendiumIndex } from "../data/compendium/_module.mjs";
import Dialogs from "./dialogs.mjs";
import { isCompendiumEntry, isItemType } from "../constants.mjs";
import AH from "../config.mjs";

/**
 * @typedef {Object} ItemMigrationAction
 * @property {AHItem} item — the item being migrated onto (world, embedded, or compendium)
 * @property {AHItem|CompendiumIndexEntry} compendiumItem — the compendium source (possibly unresolved)
 */

/**
 * @typedef {Object} ResolvedMigration
 * @property {AHItem} item — the item being migrated onto
 * @property {object} updateData — the {name, img, system, flags} payload to apply to the item
 * @property {object[]} effectUpdates — ActiveEffect update payloads, keyed by existing effect _id
 * @property {object[]} effectCreates — ActiveEffect creation payloads for effects with no target match
 */

/**
 * Resolves the actual diff for one migration action: loads the source item if needed,
 * computes the merged system data (with retained fields applied), and separates
 * effect changes into updates vs. creates. Does not write anything.
 * @param {ItemMigrationAction} action
 * @returns {Promise<ResolvedMigration>}
 */
async function resolveMigrationData({ item: targetItem, compendiumItem }) {
  const sourceItem = isCompendiumEntry(compendiumItem)
    ? await fromUuid(compendiumItem.uuid)
    : compendiumItem;

  // Merge retained fields into the clone up front — single final state, single write
  const clonedSystem = foundry.utils.deepClone(sourceItem.system);
  for (const fieldPath of targetItem.system.retainedFieldPaths) {
    const currentValue = ObjectUtils.getProperty(targetItem, `system.${fieldPath}`);
    if (currentValue !== undefined) {
      foundry.utils.setProperty(clonedSystem, fieldPath, currentValue);
    }
  }

  const updateData = {
    name: sourceItem.name,
    img: sourceItem.img,
    system: clonedSystem,
    flags: foundry.utils.deepClone(sourceItem.flags),
  };

  // Effects — still per-item, but computed here rather than written here
  const effectUpdates = [];
  const effectCreates = [];
  const targetEffectsByLabel = new Map(targetItem.effects.map((e) => [e.label, e]));

  for (const sourceEffect of sourceItem.effects) {
    const data = foundry.utils.deepClone(sourceEffect.toObject());
    delete data._id;
    delete data.origin;

    const targetEffect = targetEffectsByLabel.get(sourceEffect.label);
    if (targetEffect) {
      effectUpdates.push({
        _id: targetEffect.id,
        changes: data.changes,
        duration: data.duration,
        flags: data.flags,
        disabled: data.disabled,
        system: foundry.utils.deepClone(sourceEffect.system),
      });
    } else {
      effectCreates.push(data);
    }
  }

  return { item: targetItem, updateData, effectUpdates, effectCreates };
}

/**
 * Applies a batch of resolved migrations, grouped by target collection.
 * @param {ResolvedMigration[]} resolved
 * @returns {Promise<void>}
 */
async function applyMigrations(resolved) {
  const worldUpdates = [];
  const embeddedByActor = new Map();
  const packItemUpdates = new Map();
  const packActorUpdates = new Map();

  for (const { item, updateData } of resolved) {
    const payload = { _id: item.id, ...updateData };
    if (item.pack) {
      if (item.parent) {
        if (!packActorUpdates.has(item.parent)) packActorUpdates.set(item.parent, []);
        packActorUpdates.get(item.parent).push(payload);
      }
      else {
        if (!packItemUpdates.has(item.pack)) packItemUpdates.set(item.pack, []);
        packItemUpdates.get(item.pack).push(payload);
      }
    } else if (item.parent) {
      if (!embeddedByActor.has(item.parent)) embeddedByActor.set(item.parent, []);
      embeddedByActor.get(item.parent).push(payload);
    } else {
      worldUpdates.push(payload);
    }
  }

  const ops = [];
  // WORLD ITEMS
  if (worldUpdates.length) {
    ops.push(Item.updateDocuments(worldUpdates, { diff: false }));
  }
  // WORLD EMBEDDED ITEMS
  for (const [actor, updates] of embeddedByActor) {
    ops.push(actor.updateEmbeddedDocuments("Item", updates, { diff: false }));
  }
  // PACK EMBEDDED ITEMS
  for (const [actor, updates] of packActorUpdates) {
    ops.push(actor.updateEmbeddedDocuments("Item", updates, { diff: false }));
  }
  // PACK ITEMS
  for (const [packId, updates] of packItemUpdates) {
    ops.push(Item.updateDocuments(updates, { pack: packId, diff: false }));
  }
  await Promise.all(ops);

  // Effects can't be batched across different parent items, but each item's
  // pair of calls is independent of every other item's, so run them all in parallel.
  const effectOps = [];
  for (const { item, effectUpdates, effectCreates } of resolved) {
    if (effectUpdates.length) effectOps.push(item.updateEmbeddedDocuments("ActiveEffect", effectUpdates));
    if (effectCreates.length) effectOps.push(item.createEmbeddedDocuments("ActiveEffect", effectCreates));
  }
  await Promise.all(effectOps);
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
      const selectedActions = updates.filter((u) => uuids.has(u.item.uuid));
      const resolved = await Promise.all(selectedActions.map(resolveMigrationData));
      await applyMigrations(resolved);
      ui.notifications.info(StringUtils.localize("AH.DIALOG.CompendiumMigrateSuccess", { count: selectedActions.length }));
    }
    else {
      ui.notifications.warn(StringUtils.localize("AH.DIALOG.CompendiumMigrateFailure"));
    }
  }
}

/**
 * @param {AHItem|CompendiumIndexEntry} sourceItem
 * @param {AHItem} targetItem
 * @returns {ItemMigrationAction}
 */
function constructAction(sourceItem, targetItem) {
  return {
    item: targetItem,
    compendiumItem: sourceItem,
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
 * @param {String} slug
 * @param {Boolean} compendiumActor Whether to include entries from compendium actors.
 * @returns {Promise<AHItem[]>}
 */
async function findItemsBySlug(slug, compendiumActor) {
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
  if (compendiumActor) {
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
  }

  return matches;
}

/**
 * Pushes an update to all items that share this one's slug.
 * @param {AHItem} sourceItem
 * @param {Boolean} compendiumActor
 * @returns {Promise<ItemMigrationAction[]>}
 */
async function getItemUpdates(sourceItem, compendiumActor = true) {
  const items = await findItemsBySlug(sourceItem.system.slug, compendiumActor);

  /** @type ItemMigrationAction[] **/
  const updates = [];

  for (const item of items) {
    updates.push(constructAction(sourceItem, item));
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

/**
 * Prompts the user to migrate all actors and items from the compendium to the latest.
 * @returns {Promise<void>}
 */
async function migrateAll() {
  let updates = [];
  const itemsByType = await CompendiumIndex.instance.getItems();
  /** @type AHItem **/
  const items = Object.values(itemsByType).flat(Infinity);
  for (const item of items) {
    const itemUpdates = await getItemUpdates(item);
    updates.push(...itemUpdates);
  }
  return promptMigration("AH.DIALOG.MigrateAllHint", updates, {
    showActor: true,
  });

}

function initialize() {
  Hooks.on(AH.hooks.REGISTER_SYSTEM_SETTINGS_BUTTON, (buttons) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> ${StringUtils.localize("AH.DIALOG.MigrationTools")}`;
    button.addEventListener("click", async () => {
      return migrateAll();
    });
    buttons.push(button);
  });
}

const Migrations = Object.freeze({
  initialize,

  migrateItems,
  migrateActor,

  findItemsBySlug,
  pushItemUpdate,
  pullItemUpdate,
});

export default Migrations;
