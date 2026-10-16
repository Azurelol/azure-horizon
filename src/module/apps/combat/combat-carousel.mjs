import { AHApplication } from "../api/_module.mjs";
import { systemTemplatePath } from "../../constants.mjs";
import { AHCombat } from "../../documents/combat.mjs";

const { HandlebarsApplicationMixin, ApplicationV2 } = foundry.applications.api;
const { DragDrop } = foundry.applications.ux;

export class AHCombatCarousel extends HandlebarsApplicationMixin(ApplicationV2) {

  /** @type ApplicationConfiguration **/
  static DEFAULT_OPTIONS = {
    id: "ah-combat-carousel",
    tag: "aside",
    classes: ["ah-combat-carousel"],
    window: {
      frame: false,
      positioned: false,
    },
    actions: {
      selectCombatant: AHCombatCarousel.#onSelectCombatant,
      previousTurn: AHCombatCarousel.#onPreviousTurn,
      nextTurn: AHCombatCarousel.#onNextTurn,
    },
  };

  static PARTS = {
    carousel: {
      template: systemTemplatePath("apps/combat-carousel"),
    },
  };

  /**
   * Singular HUD instance.
   * @type {AHCombatCarousel}
   */
  static #instance = null;

  /**
   * @returns {AHCombatCarousel}
   */
  static get instance() {
    if (!this.#instance) {
      this.#instance = new AHCombatCarousel();
    }
    return this.#instance;
  }

  /** @override */
  async _prepareContext(options) {
    const combat = game.combat;
    if (!combat) {
      return {
        hasCombat: false,
        combatants: [],
      };
    }
    const tracker = ui.combat;
    const combatants = [];
    for (const [i, combatant] of combat.turns.entries()) {
      if (!combatant.visible) {
        continue;
      }
      const turn = await tracker._prepareTurnContext(combat, combatant, i);
      combatants.push({
        ...turn,
        acted: turn.acted = combat.started && i < combat.turn,
      });
    }

    return {
      hasCombat: true,
      started: combat.started,
      round: combat.round,
      isGM: game.user.isGM,
      combatants,
    };

  }

  /* -------------------------------------------- */
  /*  Mounting                                    */
  /* -------------------------------------------- */

  /** Mount into #ui-top instead of document.body. */
  _insertElement(element) {
    const existing = document.getElementById(element.id);
    if (existing) return existing.replaceWith(element);
    const top = document.getElementById("ui-top");
    (top ?? document.body).append(element);
  }

  /* -------------------------------------------- */
  /*  Rendering                                   */
  /* -------------------------------------------- */

  _onRender(context, options) {
    super._onRender?.(context, options);
    this.element.hidden = !context.hasCombat;

    const track = this.element.querySelector(".ah-combat-carousel__track");
    track?.querySelector(".is-active")?.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: options.isFirstRender ? "instant" : "smooth",
    });

    for (const el of this.element.querySelectorAll("[data-combatant-id]")) {
      el.addEventListener("mouseenter", (e) => this.#hover(e, el, true));
      el.addEventListener("mouseleave", (e) => this.#hover(e, el, false));
    }
  }

  #hover(event, el, isIn) {
    const token = game.combat?.combatants.get(el.dataset.combatantId)?.token?.object;
    if (!token?.isVisible) return;
    if (isIn) token._onHoverIn(event, { hoverOutOthers: true });
    else token._onHoverOut(event);
  }

  /* -------------------------------------------- */
  /*  Event handlers
  /* -------------------------------------------- */

  static async #onSelectCombatant(event, target) {
    const combatant = game.combat?.combatants.get(target.dataset.combatantId);
    const token = combatant?.token?.object;
    if (!token) return;
    if (combatant.isOwner) token.control({ releaseOthers: true });
    await canvas.animatePan({ x: token.center.x, y: token.center.y });
  }

  static #onPreviousTurn() {
    return game.combat?.previousTurn();
  }

  static #onNextTurn() {
    return game.combat?.nextTurn();
  }

  /* -------------------------------------------- */
  /*  Registration                                */
  /* -------------------------------------------- */

  static initialize() {
    Hooks.once("ready", async () => {
      AHCombatCarousel.instance.render({ force: true });
    });

    const refresh = foundry.utils.debounce(
      () => AHCombatCarousel.instance?.render({ force: true }),
      50,
    );

    for (const hook of [
      "createCombat", "updateCombat", "deleteCombat",
      "createCombatant", "updateCombatant", "deleteCombatant",
      "combatStart", "combatTurnChange", "combatRound",
    ]) Hooks.on(hook, refresh);
    Hooks.on("updateToken", refresh);
    Hooks.on("canvasReady", refresh);
  }

}
