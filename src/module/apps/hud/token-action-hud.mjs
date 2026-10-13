
import {
  getUserFlag,
  localize,
  setUserFlag,
  systemID,
  systemTemplatePath,
} from "../../constants.mjs";
import AH from "../../config.mjs";

import { HTMLUtils } from "../../utils/_module.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

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

/**
 * Item groups.
 * `types`: item types shown in the group.
 * `filter`: optional (item) => boolean for finer control.
 */
export const ITEM_GROUPS = [
  { id: "attacks", label: "AH.ACTION.Attack", types: ["weapon", "attack"] },
  { id: "features", label: "AH.ACTION.Feature", types: ["skill", "classFeature", "ability"] },
  { id: "spells", label: "AH.ACTION.Spell", types: ["spell"] },
  { id: "consumables", label: "AH.ACTION.Consumable", types: ["consumable"] },
];

/** Item types that should never show up on the HUD. */
export const IGNORED_TYPES = new Set([
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
function buildData(actor, { openGroups = new Set() } = {}) {
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

/**
 * Action HUD for selected tokens.
 * @remarks When to refresh is handled by hooks.
 * @property {Boolean} rendered
 */
export default class AHTokenActionHUD extends HandlebarsApplicationMixin(ApplicationV2) {
  /**
   * Currently expanded group ids.
   * @type {Set<any>}
   */
  #openGroups = new Set();
  /**
   * The current model
   * @type {null}
   */
  #model = null;
  /**
   * Singular HUD instance.
   * @type {AHTokenActionHUD}
   */
  static #instance = null;

  /**
   * @returns {AHTokenActionHUD}
   */
  static get instance() {
    if (!this.#instance) {
      this.#instance = new AHTokenActionHUD();
    }
    return this.#instance;
  }

  static DEFAULT_OPTIONS = {
    id: "ah-action-hud",
    classes: ["ah-hud-app"],
    tag: "div",
    window: {
      frame: false,
      positioned: true,
    },
    position: {
      width: "auto",
      height: "auto",
    },
    actions: {
      toggleGroup: AHTokenActionHUD.#onToggleGroup,
      useAction: { handler: AHTokenActionHUD.#onUseAction, buttons: [0, 2] },
    },
  };

  static PARTS = {
    hud: { template: systemTemplatePath("apps/token-action-hud") },
  };

  /* -------------------------------------------- */
  /*  Properties                                  */
  /* -------------------------------------------- */

  /**
   * The actor the HUD should show, or null to hide it.
   * One controlled token wins. With no selection, fall back to the user's
   * assigned character. Multiple selections hide the HUD for now.
   * @returns {AHActor|null}
   */
  get actor() {
    const controlled = canvas?.tokens?.controlled ?? [];
    if (controlled.length === 1) return controlled[0].actor ?? null;
    if (controlled.length > 1) return null;
    return game.user.character ?? null;
  }

  /** Whether `actor` is the one currently shown. */
  isCurrentActor(actor) {
    return !!actor && actor.id === this.#model?.actorId;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async refresh() {
    const actor = this.actor;
    if (!actor?.isOwner) return this.#hide();
    this.#model = buildData(actor, { openGroups: this.#openGroups });
    if (!this.#model?.groups.length) return this.#hide();

    return this.render({ force: true });
  }

  async #hide() {
    this.#model = null;
    this.#openGroups.clear();
    if (this.rendered) await this.close({ animate: false });
  }

  /** @override */
  async _prepareContext(options) {
    const model = this.#model;
    return {
      name: model?.name ?? "",
      groups: model?.groups ?? [],
    };
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    this.#applyPosition();
    this.#bindDrag();
  }

  /**
   * AppV2 positions frameless apps on its own, so re-apply the saved spot
   * after each render.
   */
  #applyPosition() {
    const saved = getUserFlag(AH.flags.HUD.Position);
    const top = Math.clamp(saved?.top ?? 120, 0, window.innerHeight - 40);
    const left = Math.clamp(saved?.left ?? 120, 0, window.innerWidth - 40);
    Object.assign(this.element.style, { top: `${top}px`, left: `${left}px`, bottom: "auto", right: "auto" });
  }

  /** Make the grip handle drag the HUD. Saves position on release. */
  #bindDrag() {
    const handle = this.element.querySelector("[data-part='dragHandle']");
    if (!handle) return;

    handle.addEventListener("pointerdown", down => {
      down.preventDefault();
      handle.setPointerCapture(down.pointerId);
      const startX = down.clientX;
      const startY = down.clientY;
      const startTop = this.element.offsetTop;
      const startLeft = this.element.offsetLeft;

      const move = ev => {
        this.element.style.top = `${startTop + ev.clientY - startY}px`;
        this.element.style.left = `${startLeft + ev.clientX - startX}px`;
      };
      const up = async ev => {
        handle.releasePointerCapture(ev.pointerId);
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", up);
        await setUserFlag(AH.flags.HUD.Position, {
          top: this.element.offsetTop,
          left: this.element.offsetLeft,
        });
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", up);
    });
  }

  /* -------------------------------------------- */
  /*  Event handlers
  /* -------------------------------------------- */

  /**
   * Expand or collapse a group. One group is open at a time.
   * @this {AHTokenActionHUD}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static #onToggleGroup(event, target) {
    const id = target.dataset.groupId;
    const wasOpen = this.#openGroups.has(id);
    this.#openGroups.clear();
    if (!wasOpen) this.#openGroups.add(id);

    // Toggle in the DOM directly. A full re-render here would be wasteful.
    for (const el of this.element.querySelectorAll("[data-group-id].ah-hud__group")) {
      el.classList.toggle("ah-hud__group--open", this.#openGroups.has(el.dataset.groupId));
    }
  }

  /**
   * Left click runs the action.
   * Right click runs its secondary action (open * the item sheet) when it has one.
   * @this {AHTokenActionHUD}
   * @param {PointerEvent} event
   * @param {HTMLElement} target
   */
  static async #onUseAction(event, target) {
    event.preventDefault();
    const action = this.#model?.actions.get(target.dataset.actionId);
    if (!action) return;

    try {
      if (event.button === 2) await action.onContext?.(event);
      else await action.onClick?.(event);
    } catch (err) {
      console.error(`${systemID} | HUD action "${action.name}" failed`, err);
      ui.notifications.error(`Could not run "${action.name}".`);
    }
    target.blur();
  }

  /* -------------------------------------------- */
  /*  Initialization                                   */
  /* -------------------------------------------- */

  /**
   * Registers to needed hooks.
   */
  static initialize() {
    Hooks.once("ready", () => {
      const hud = AHTokenActionHUD.instance;

      // Many hooks can fire in one tick (selecting a token, updating several
      // items). Coalesce them into a single rebuild.
      const refresh = foundry.utils.debounce(() => hud.refresh(), 30);

      // Selection changes always matter.
      Hooks.on("controlToken", refresh);

      // Actor data: only if it is the actor on screen.
      Hooks.on("updateActor", actor => { if (hud.isCurrentActor(actor)) refresh(); });
      Hooks.on("deleteActor", actor => { if (hud.isCurrentActor(actor)) refresh(); });

      // Embedded documents: items and effects belong to an actor via `parent`.
      for (const name of ["createItem", "updateItem", "deleteItem"]) {
        Hooks.on(name, item => { if (hud.isCurrentActor(item.parent)) refresh(); });
      }
      for (const name of ["createActiveEffect", "deleteActiveEffect"]) {
        Hooks.on(name, effect => { if (hud.isCurrentActor(effect.parent)) refresh(); });
      }

      // Combat membership changes the Utility group's label.
      for (const name of ["createCombatant", "deleteCombatant", "createCombat", "deleteCombat"]) {
        Hooks.on(name, refresh);
      }

      // Sheet or token deleted out from under us.
      Hooks.on("deleteToken", refresh);

      // Let other code force a refresh: Hooks.callAll("ahHudRefresh").
      Hooks.on(AH.hooks.HUD_REFRESH, refresh);

      // Expose for macros and debugging.
      game.system.hud = hud;

      // Initial paint (e.g. a player with an assigned character).
      refresh();
    });
  }

}
