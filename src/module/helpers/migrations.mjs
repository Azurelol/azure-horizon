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
 * @typedef {Object} ItemMigration
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
 * @returns {Promise<ItemMigration>}
 */
async function resolveItemMigrationData({ item, compendiumItem }) {
  const sourceItem = isCompendiumEntry(compendiumItem)
    ? await fromUuid(compendiumItem.uuid)
    : compendiumItem;

  // Merge retained fields into the clone up front — single final state, single write
  const clonedSystem = foundry.utils.deepClone(sourceItem.system);
  for (const fieldPath of (item.system.retainedFieldPaths ?? [])) {
    const currentValue = ObjectUtils.getProperty(item, `system.${fieldPath}`);
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
  const targetEffectsByLabel = new Map(item.effects.map((e) => [e.label, e]));

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

  return { item, updateData, effectUpdates, effectCreates };
}

/**
 * @typedef {Object} ActorMigrationAction
 * @property {AHActor} actor — the actor being migrated onto (world, embedded, or compendium)
 * @property {AHActor|CompendiumIndexEntry} compendiumActor — the compendium source (possibly unresolved)
 */

/**
 * Resolves the actual diff for one actor migration action: loads the source actor if needed,
 * computes the merged system data (with retained fields applied), separates effect changes
 * into updates vs. creates, and resolves migrations for each of the actor's embedded items
 * (matched to the source actor's items by name) using the same per-item logic as
 * resolveMigrationData. Does not write anything.
 * @param {ActorMigrationAction} action
 * @returns {Promise<ActorMigration>}
 */
async function resolveActorMigrationData({ actor, compendiumActor }) {
  const sourceActor = isCompendiumEntry(compendiumActor)
    ? await fromUuid(compendiumActor.uuid)
    : compendiumActor;

  // Merge retained fields into the clone up front — single final state, single write
  const clonedSystem = foundry.utils.deepClone(sourceActor.system);
  for (const fieldPath of (actor.system.retainedFieldPaths ?? [])) {
    const currentValue = ObjectUtils.getProperty(actor, `system.${fieldPath}`);
    if (currentValue !== undefined) {
      foundry.utils.setProperty(clonedSystem, fieldPath, currentValue);
    }
  }

  const updateData = {
    name: sourceActor.name,
    img: sourceActor.img,
    system: clonedSystem,
    flags: foundry.utils.deepClone(sourceActor.flags),
  };

  // Effects — directly on the actor
  const effectUpdates = [];
  const effectCreates = [];
  const targetEffectsByLabel = new Map(actor.effects.map((e) => [e.label, e]));

  for (const sourceEffect of sourceActor.effects) {
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

  // Items — matched to the source actor's items by name. Matched items get run through
  // resolveMigrationData so they retain fields / diff their own effects exactly like a
  // standalone item migration; unmatched source items are created fresh on the actor.
  const itemMigrations = [];
  const itemCreates = [];
  const sourceItemsByName = new Map(sourceActor.items.map((i) => [i.name, i]));

  for (const targetItem of actor.items) {
    const sourceItem = sourceItemsByName.get(targetItem.name);
    if (sourceItem) {
      itemMigrations.push(
        await resolveItemMigrationData({ item: targetItem, compendiumItem: sourceItem }),
      );
    }
  }

  for (const sourceItem of sourceActor.items) {
    if (!actor.items.some((i) => i.name === sourceItem.name)) {
      const data = foundry.utils.deepClone(sourceItem.toObject());
      delete data._id;
      itemCreates.push(data);
    }
  }

  return { actor, updateData, effectUpdates, effectCreates, itemMigrations, itemCreates };
}

/**
 * Applies a batch of resolved migrations, grouped by target collection.
 * @param {ItemMigration[]} resolved
 * @returns {Promise<void>}
 */
async function applyItemMigrations(resolved) {
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
 * @typedef {Object} ActorMigration
 * @property {AHActor} actor — the actor being migrated onto
 * @property {object} updateData — the {name, img, system, flags} payload to apply to the item
 * @property {object[]} effectUpdates — ActiveEffect update payloads, keyed by existing effect _id
 * @property {object[]} effectCreates — ActiveEffect creation payloads for effects with no target match
 * @property {object[]} itemMigrations
 * @property {object[]} itemCreates
 */

/**
 * Applies a batch of resolved migrations, grouped by target collection.
 * @param {ActorMigration[]} resolved
 * @returns {Promise<void>}
 */
async function applyActorMigrations(resolved) {
  const worldUpdates = [];
  const packActorUpdates = new Map();

  for (const { actor, updateData } of resolved) {
    const payload = { _id: actor.id ?? actor._id, ...updateData };
    if (actor.pack) {
      if (!packActorUpdates.has(actor.pack)) packActorUpdates.set(actor.pack, []);
      packActorUpdates.get(actor.pack).push(payload);
    } else {
      worldUpdates.push(payload);
    }
  }

  const ops = [];
  // WORLD ACTORS
  if (worldUpdates.length) {
    ops.push(Actor.updateDocuments(worldUpdates, { diff: false }));
  }
  // PACK ACTORS
  for (const [packId, updates] of packActorUpdates) {
    ops.push(Actor.updateDocuments(updates, { pack: packId, diff: false }));
  }
  await Promise.all(ops);

  // Actor-level effects, and the actor's owned-item updates/creates, can all run in
  // parallel per actor — each actor's set of calls is independent of every other actor's.
  const actorLevelOps = [];
  for (const { actor, effectUpdates, effectCreates, itemMigrations, itemCreates } of resolved) {
    if (effectUpdates.length) actorLevelOps.push(actor.updateEmbeddedDocuments("ActiveEffect", effectUpdates));
    if (effectCreates.length) actorLevelOps.push(actor.createEmbeddedDocuments("ActiveEffect", effectCreates));

    if (itemMigrations?.length) {
      const itemPayloads = itemMigrations.map(({ item, updateData }) => ({ _id: item.id, ...updateData }));
      actorLevelOps.push(actor.updateEmbeddedDocuments("Item", itemPayloads, { diff: false }));
    }
    if (itemCreates.length) actorLevelOps.push(actor.createEmbeddedDocuments("Item", itemCreates));
  }
  await Promise.all(actorLevelOps);

  // Item-level effects (on items belonging to migrated actors) can't be batched across
  // different parent items, but each item's pair of calls is independent of every
  // other item's, so run them all in parallel.
  const itemEffectOps = [];
  for (const { itemMigrations } of resolved) {
    for (const { item, effectUpdates, effectCreates } of itemMigrations) {
      if (effectUpdates.length) itemEffectOps.push(item.updateEmbeddedDocuments("ActiveEffect", effectUpdates));
      if (effectCreates.length) itemEffectOps.push(item.createEmbeddedDocuments("ActiveEffect", effectCreates));
    }
  }
  await Promise.all(itemEffectOps);
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
      const resolved = await Promise.all(selectedActions.map(resolveItemMigrationData));
      await applyItemMigrations(resolved);
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
    const actorEntries = await CompendiumIndex.instance.getActorEntries();
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
async function migrateAllItems() {
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

/**
 * @param {Boolean} world
 * @param {Boolean} compendium
 * @param {AH_ActorType} type
 * @returns {Promise<AHActor[]>}
 */
async function selectActors(world = true, compendium = false, type = undefined) {
  let actors = [];
  if (world) {
    actors.push(...game.actors.contents);
  }

  const actorEntries = await CompendiumIndex.instance.getActorEntries();
  /** @type CompendiumIndexEntry[] **/
  const compendiumActors = [...actorEntries.hero, ...actorEntries.adversary, ...actorEntries.follower];
  actors.push(...compendiumActors);

  if (type) {
    actors = actors.filter((actor) => actor.type === type);
  }

  if (!actors.length) {
    return undefined;
  }
  const title = `${StringUtils.localize("CONTROLS.CommonSelect")} ${StringUtils.localize("DOCUMENT.Actor")}`;

  const data = {
    title: title,
    style: "list",
    items: actors,
    getDescription: async (item) => {
      const text = item.name ?? "";
      return text;
    },
  };
  const selected = await Dialogs.itemSelect(data);
  return selected;
}

/**
 * @returns {Promise<void>}
 */
async function updateTokens() {
  let actors = await selectActors(true, true);
  if (actors.length === 0) {
    return;
  }

  /** @type ActorMigration[] **/
  const migrations = actors.map(actor => {

    let data = {
      "prototypeToken.texture.fit": "cover",
    };

    switch (actor.type) {
      case "hero":
        data["prototypeToken.bar2.attribute"] = "";
        data["prototypeToken.displayBars"] = foundry.CONST.TOKEN_DISPLAY_MODES.HOVER;
        break;

      case "adversary":
        data["prototypeToken.bar2.attribute"] = "resources.pp";
        data["prototypeToken.displayBars"] = foundry.CONST.TOKEN_DISPLAY_MODES.ALWAYS;
        break;
    }

    return {
      actor: actor,
      updateData: data,
      effectUpdates: [],
      effectCreates: [],
      itemCreates: [],
      itemMigrations: [],
    };
  });

  await applyActorMigrations(migrations);
  ui.notifications.info(`Updated ${actors.length} actors.`);
}

/**
 * @returns {Promise<void>}
 */
async function migrateAdversaries() {
  const actorEntries = await CompendiumIndex.instance.getActorEntries();
  /** @type AHActor[] **/
  const worldAdversaries = game.actors.contents.filter(a => a.type === "adversary");
  const compendiumAdversaries = [...actorEntries.adversary];

  let migrations = [];

  for (const adversary of compendiumAdversaries) {
    const copies = worldAdversaries.filter(actor => actor.system.profile.slug === adversary.system.profile.slug);
    for (const copy of copies) {

      const data = await resolveActorMigrationData({
        actor: copy,
        compendiumActor: adversary,
      });
      migrations.push(data);
    }
  }

  /** @type ItemSelectionData **/
  const dialogData = {
    title: "AH.DIALOG.MigrateAdversaries",
    style: "list",
    items: migrations.map(m => m.actor),
    payload: migrations,
    getDescription: async (item) => {
      const text = item.name ?? "";
      return text;
    },
  };
  const selected = await Dialogs.itemSelect(dialogData);
  if (selected.length > 0) {
    await applyActorMigrations(selected);
    ui.notifications.info(`Updated ${selected.length} actors.`);
  }
}

/**
 * @returns {Promise<void>}
 */
async function openMenu() {
  await Dialogs.choice({
    title: "AH.DIALOG.MigrationTools",
    content: StringUtils.localize("AH.DIALOG.MigrationToolsHint"),
    buttons: [
      {
        action: "migrateItems",
        label: "AH.DIALOG.MigrateItems",
        callback: async (event, button, dialog) => {
          await migrateAllItems();
          await dialog.close({ animate: false });
          return true;
        },
      },
      {
        action: "updateTokens",
        label: "AH.DIALOG.UpdateTokens",
        callback: async (event, button, dialog) => {
          await updateTokens();
          await dialog.close({ animate: false });
          return true;
        },
      },
      {
        action: "migrateAdversaries",
        label: "AH.DIALOG.MigrateAdversaries",
        callback: async (event, button, dialog) => {
          await migrateAdversaries();
          await dialog.close({ animate: false });
          return true;
        },
      },
    ],
  });
}

function initialize() {
  Hooks.on(AH.hooks.REGISTER_SYSTEM_SETTINGS_BUTTON, (buttons) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `<i class="fa-solid fa-arrows-rotate"></i> ${StringUtils.localize("AH.DIALOG.MigrationTools")}`;
    button.addEventListener("click", async () => {
      return openMenu();
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
