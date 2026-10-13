
import {
  getUserFlag,
  localize, renderTemplate,
  setUserFlag,
  systemID,
  systemTemplatePath,
} from "../../constants.mjs";
import AH from "../../config.mjs";

import { buildTokenActionMap } from "./token-action-data.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;

/**
 * @typedef {'popout'|'docked'} TokenActionHUDLayout
 */

const LAYOUT_TEMPLATES = {
  popout: systemTemplatePath("apps/hud/token-action-hud-popout"),
  docked: systemTemplatePath("apps/hud/token-action-hud-docked"),
};

/**
 * Action HUD for selected tokens.
 * @remarks When to refresh is handled by hooks.
 * @property {Boolean} rendered
 * @property {HTMLElement} element
 */
export default class AHTokenActionHUD extends HandlebarsApplicationMixin(ApplicationV2) {
  /**
   * Currently expanded group ids.
   * @type {Set<any>}
   */
  #openGroups = new Set();
  /**
   * The currently assigned data.
   * @type {TokenActionMap}
   */
  #data = null;
  /**
   * @type {TokenActionHUDLayout}
   */
  #layout = "docked";

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

  /** @type ApplicationConfiguration **/
  static DEFAULT_OPTIONS = {
    id: "ah-action-hud",
    classes: ["ah-hud-app"],
    tag: "div",
    window: {
      frame: false,
    },
    position: {
      width: "auto",
      height: "auto",
      top: 140,
      left: 140,
    },
    actions: {
      toggleGroup: AHTokenActionHUD.#onToggleGroup,
      useAction: { handler: AHTokenActionHUD.#onUseAction, buttons: [0, 2] },
    },
  };

  static PARTS = {
    hud: {
      template: systemTemplatePath("apps/token-action-hud"),
      templates: Object.values(LAYOUT_TEMPLATES),
    },
  };

  /** @override */
  async _prepareContext(options) {
    const data = this.#data;
    let context = {
      actor: this.actor,
      name: data?.name ?? "",
      groups: data?.groups ?? [],
    };

    let backgroundClass;
    switch (this.actor.type) {
      case "hero":
        backgroundClass = "--ah-hero-background-gradient";
        break;
      case "follower":
        break;
      case "adversary":
        backgroundClass = "--ah-adversary-background-gradient";
        break;
      case "entity":
        break;
      case "unit":
        break;

    }

    context.backgroundClass = backgroundClass;

    context.template = await renderTemplate(LAYOUT_TEMPLATES[this.#layout], context, false);

    return context;
  }

  /** @override */
  _onRender(context, options) {
    super._onRender(context, options);
    switch (this.#layout) {
      case "popout":
        this.#bindDrag();
        this.element.classList.add("--popout");
        break;
      case "docked":
        this.#attach();
        this.element.classList.add("--docked");
        break;
    }
  }

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
    return !!actor && actor.id === this.#data?.actorId;
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  async refresh() {
    const actor = this.actor;
    if (!actor?.isOwner) return this.#hide();
    this.#data = buildTokenActionMap(actor, { openGroups: this.#openGroups });
    if (!this.#data?.groups.length) return this.#hide();

    return this.render({ force: true });
  }

  async #hide() {
    this.#data = null;
    this.#openGroups.clear();
    if (this.rendered) await this.close({ animate: false });
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
        const top = startTop + ev.clientY - startY;
        const left = startLeft + ev.clientX - startX;
        this.setPosition({
          top: top,
          left: left,
        });
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

  /**
   * Attach the hud to the hotbar
   */
  #attach() {
    const footer = document.querySelector("footer");
    footer.insertBefore(this.element, footer.firstChild);

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
    const action = this.#data?.actions.get(target.dataset.actionId);
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
