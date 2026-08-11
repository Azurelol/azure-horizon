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
      ],
    },
    tabs: {
      template: systemTemplatePath("sheets/document-tabs"),
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

  /** @type ActionHandler **/
  #actionHandler;

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
        if (!this.#actionHandler) {
          this.#actionHandler = new ActionHandler(this.actor);
        }
        this.#actionHandler.setupMenu(html);
        Handlebars.setupComponent.resourceBar(html);
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
