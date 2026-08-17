import { AHActorSheet } from "./actor-sheet.mjs";
import { systemPath, systemTemplatePath } from "../../constants.mjs";
import Handlebars from "../../helpers/handlebars.mjs";
import { ActionHandler } from "../ui/_module.mjs";

/**
 * @extends AHActorSheet
 * @property {AHActor} actor
 * @property {CharacterDataModel} system
 * @inheritDoc
 */
export class AHBaseCharacterSheet extends AHActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ah-character"],
    position: {
      width: 850,
      height: 800,
    },
    actions: {
      rest: this.#rest,
    },
  };

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemTemplatePath("sheets/actor/character/character-header"),
    },
    sidebar: {
      template: systemTemplatePath("sheets/actor/character/character-sidebar"),
      templates: [
        systemTemplatePath("sheets/actor/character/character-partial-actions"),
        systemTemplatePath("sheets/actor/character/character-partial-inventory"),
      ],
    },
    tabs: {
      template: systemTemplatePath("sheets/document-tabs"),
    },
    effects: {
      template: systemTemplatePath("sheets/actor/character/character-effects"),
      templates: [
        systemTemplatePath("sheets/actor/character/character-partial-modifiers"),
      ],
    },
  };

  /* -------------------------------------------------- */
  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    Object.assign(context, {
    });

    return context;
  }

  /**
   * @returns {ActionHandler}
   */
  get actionHandler() {
    if (!this.#actionHandler) {
      this.#actionHandler = new ActionHandler(this.actor);
    }
    return this.#actionHandler;
  }
  #actionHandler;

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    await super._preparePartContext(partId, context);
    switch (partId) {
      case "sidebar": {
        context.actions = this.actionHandler.getMenuActions();
        break;
      }
      case "effects":
        context.modifiers = this.actor.system.parameters.summarizeModifiers();
        break;
    }
  }

  /**
   * Attach event listeners to rendered template parts.
   * @param {string} partId The id of the part being rendered.
   * @param {HTMLElement} html The rendered HTML element for the part.
   * @param {ApplicationRenderOptions} options Rendering options passed to the render method.
   * @protected
   */
  _attachPartListeners(partId, html, options) {
    super._attachPartListeners(partId, html, options);
    switch (partId) {
      case "sidebar":
      {
        this.actionHandler.setupMenu(html);
        break;
      }
    }
  }

  /* -------------------------------------------------- */
  /**
   * @this AHBaseCharacterSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #rest(event, target) {
    const { type } = target.dataset;
    return this.actor.rest(type);
  }

}
