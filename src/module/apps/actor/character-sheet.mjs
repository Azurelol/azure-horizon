import { AHActorSheet } from "./actor-sheet.mjs";
import { systemPath, systemTemplatePath } from "../../constants.mjs";
import Handlebars from "../../helpers/handlebars.mjs";
import { EquipmentTableRenderer } from "../item/_module.mjs";
import { EquipmentDataModel } from "../../data/actor/system/_module.mjs";

/**
 * @extends AHActorSheet
 * @property {AHActor} actor
 * @property {CharacterDataModel} system
 * @inheritDoc
 */
export class AHCharacterSheet extends AHActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ah-character"],
    position: {
      width: 850,
      height: 800,
    },
    actions: {
    },
  };

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "features", label: "AH.SHEET.Tabs.Features", icon: "ra ra-fluffy-swirl" },
        { id: "equipment", label: "AH.SHEET.Tabs.Equipment", icon: "ra ra-double-team" },
        { id: "effects", label: "AH.SHEET.Tabs.Effects", icon: "ra ra-book" },
      ],
      initial: "overview",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemTemplatePath("sheets/actor/character/character-header"),
    },
    sidebar: {
      template: systemTemplatePath("sheets/actor/character/character-sidebar"),
    },
    tabs: {
      template: systemTemplatePath("sheets/document-tabs"),
    },

    features: {
      template: systemTemplatePath("sheets/actor/character/character-features"),
    },
    equipment: {
      template: systemTemplatePath("sheets/actor/character/character-equipment"),
    },
    effects: {
      template: systemTemplatePath("sheets/document-effects"),
    },
  };

  /* -------------------------------------------------- */

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
        Handlebars.setupComponent.resourceBar(html);
        break;
      }
    }
  }

  #equipmentTableRenderer = new EquipmentTableRenderer();

  /**
   * @returns {AHItem[]}
   */
  getEquipmentEntries() {
    const entries = this.actor.getItemsByType(...EquipmentDataModel.EQUIPMENT_TYPES);
    return entries;
  }

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    await super._preparePartContext(partId, context);
    switch (partId) {
      case "equipment":
        context.equipmentTable = await this.#equipmentTableRenderer.render(this.getEquipmentEntries());
        break;
    }
    return context;
  }

}
