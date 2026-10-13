/**
 * @typedef TokenActionReference
 * @property id
 * @property name
 * @property img
 * @property tooltip
 */

/**
 * @typedef TokenActionGroup
 * @property id
 * @property label
 * @property {Boolean} open
 * @property {TokenActionReference[]} actions Doesn't include the onClick/onContext
 */

/**
 * @typedef {TokenActionReference} TokenActionData
 * @property id
 * @property name
 * @property img
 * @property tooltip
 */

/**
 * @typedef TokenActionMap
 * @property {String} actorId
 * @property {String} name
 * @property {String, TokenActionData[]} groups
 * @property {TokenActionData[]} actions
 */

import { HTMLUtils } from "../../utils/_module.mjs";
import { localize } from "../../constants.mjs";

/**
 * Item groups.
 * `types`: item types shown in the group.
 * `filter`: optional (item) => boolean for finer control.
 */
const ITEM_GROUPS = [
  { id: "attacks", label: "AH.ACTION.Attack", types: ["weapon", "attack"] },
  { id: "features", label: "AH.ACTION.Feature", types: ["skill", "classFeature", "ability"] },
  { id: "spells", label: "AH.ACTION.Spell", types: ["spell"] },
  { id: "consumables", label: "AH.ACTION.Consumable", types: ["consumable"] },
];

/** Item types that should never show up on the HUD. */
const IGNORED_TYPES = new Set([
  "armor",
  "class",
]);

/**
 * @param {AHItem} item
 * @param {Event} event
 */
async function useItem(item, event) {
  if (item.perform) {
    const modifiers = HTMLUtils.getKeyboardModifiers(event);
    return item.perform(modifiers);
  }
  return item.sheet.render({ force: true });
}

/**
 * @param {AHActor} actor
 * @param {Object} options
 * @param options.openGroups
 * @return {TokenActionMap}
 */
export function buildTokenActionMap(actor, { openGroups = new Set() } = {}) {
  if (!actor) return null;

  /** @type {Map<string, TokenActionData>} action id -> action, for click lookup */
  const actions = new Map();
  /** @type {TokenActionGroup[]} **/
  const groups = [];

  const pushGroup = (id, label, list) => {
    if (!list.length) return;
    for (const action of list) {
      actions.set(action.id, action);
    }
    groups.push({
      id,
      label,
      open: openGroups.has(id),
      actions: list.map(({ id, name, img, tooltip }) => ({ id, name, img, tooltip })),
    });
  };

  /** @returns {TokenActionData} **/
  const itemAction = item => ({
    id: `item.${item.id}`,
    name: item.name,
    img: item.img,
    tooltip: item.name,
    onClick: event => useItem(item, event),
    onContext: () => item.sheet.render({ force: true }),
  });

  // Items claimed by an explicit group definition.
  const claimed = new Set();
  for (const def of ITEM_GROUPS) {
    const list = actor.items
      .filter(i => !IGNORED_TYPES.has(i.type) && def.types.includes(i.type) && (def.filter?.(i) ?? true))
      .map(itemAction);
    actor.items.forEach(i => { if (def.types.includes(i.type)) claimed.add(i.id); });
    pushGroup(def.id, def.label, list);
  }

  // Everything else, grouped by item type.
  const byType = new Map();
  for (const item of actor.items) {
    if (claimed.has(item.id) || IGNORED_TYPES.has(item.type)) continue;
    if (!byType.has(item.type)) byType.set(item.type, []);
    byType.get(item.type).push(itemAction(item));
  }
  for (const [type, list] of byType) {
    const key = CONFIG.Item.typeLabels?.[type];
    const label = key ? localize(key) : type;
    list.sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
    pushGroup(`type.${type}`, label, list);
  }

  // Utility group: things that are about the token, not an item.
  const token = actor.token ?? actor.getActiveTokens()[0]?.document;
  const utility = [{
    id: "util.sheet",
    name: "Sheet",
    img: null,
    tooltip: "Open character sheet",
    onClick: () => actor.sheet.render({ force: true }),
  }];
  if (token && game.combat) {
    utility.push({
      id: "util.combat",
      name: token.inCombat ? "Leave Combat" : "Join Combat",
      img: null,
      tooltip: token.inCombat ? "Remove from combat" : "Add to combat",
      onClick: () => token.toggleCombatant(),
    });
  }
  pushGroup("util", "Utility", utility);
  return {
    actorId: actor.id,
    name: actor.name,
    groups,
    actions,
  };
}
