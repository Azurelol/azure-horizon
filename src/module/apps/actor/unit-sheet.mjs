import { AHActorSheet } from "./actor-sheet.mjs";
import { systemTemplatePath } from "../../constants.mjs";
import { ActionTableRenderer, WeaponTableRenderer } from "../item/_module.mjs";
import { CharacterSheet } from "./character-sheet.mjs";
import { TableRendererRegistry } from "../api/table-renderer.mjs";

/**
 * @extends AHActorSheet
 * @property {AHActor} actor
 * @property {UnitDataModel} system
 * @inheritDoc
 */
export class UnitSheet extends AHActorSheet {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ah-entity"],
    position: {
      width: 720,
      height: 800,
    },
    actions: {
    },
  };

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "status", label: "AH.SHEET.Tabs.Status", icon: "ra ra-fluffy-swirl" },
        { id: "effects", label: "AH.SHEET.Tabs.Effects", icon: "ra ra-book" },
      ],
      initial: "overview",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    ...super.PARTS,

    header: {
      template: systemTemplatePath("sheets/actor/unit/unit-header"),
    },
    status: {
      template: systemTemplatePath("sheets/actor/unit/unit-status"),
    },
    effects: {
      template: systemTemplatePath("sheets/document-effects"),
    },
  };

  #tableRenderers = new TableRendererRegistry();
  #consumableTableRenderer = this.#tableRenderers.register("consumable", new ActionTableRenderer({ title: "AH.ITEM.Consumable", actions: CharacterSheet.getCompendiumTableActions("equipment", "consumable") }));
  #equipmentTableRenderer = this.#tableRenderers.register("tactica", new ActionTableRenderer({ title: "AH.ITEM.Equipment", actions: CharacterSheet.getCompendiumTableActions("tactica", "tactica") }));

  /* -------------------------------------------------- */
  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    await super._preparePartContext(partId, context);
    switch (partId) {
      case "status": {
        context.tables = [
          await this.#consumableTableRenderer.render(this.actor.getItemsByType("consumable")),
          await this.#equipmentTableRenderer.render(this.actor.getItemsByType("tactica")),
        ];
        break;
      }
    }
    return context;
  }

  /* -------------------------------------------------- */

}
