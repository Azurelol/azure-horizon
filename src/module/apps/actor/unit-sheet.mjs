import { AHActorSheet } from "./actor-sheet.mjs";
import { systemTemplatePath } from "../../constants.mjs";
import {
  ActionTableRenderer,
  TacticaTableRenderer,
  TacticaWeaponTableRenderer,
} from "../item/_module.mjs";
import { CharacterSheet } from "./character-sheet.mjs";
import { TableRendererRegistry } from "../api/table-renderer.mjs";
import { TacticaClassTableRenderer } from "../item/tactica-table-renderer.mjs";

/**
 * @property {AHActor} actor
 * @property {UnitDataModel} system
 * @inheritDoc
 */
export class UnitSheet extends CharacterSheet {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
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
      initial: "status",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    ...super.PARTS,
    status: {
      template: systemTemplatePath("sheets/actor/unit/unit-status"),
    },
  };

  #tableRenderers = new TableRendererRegistry();
  #consumableTableRenderer = this.#tableRenderers.register("consumable", new ActionTableRenderer({ title: "AH.ITEM.Consumable", actions: CharacterSheet.getCompendiumTableActions("equipment", "consumable") }));
  #classesTableRenderer = this.#tableRenderers.register("tactica", new TacticaClassTableRenderer({ title: "AH.ITEM.Class.long", actions: CharacterSheet.getCompendiumTableActions("tactica", "tactica") }));
  #weaponsTableRenderer = this.#tableRenderers.register("tactica", new TacticaWeaponTableRenderer({ title: "AH.ITEM.Weapon", actions: CharacterSheet.getCompendiumTableActions("tactica", "tactica") }));
  #skillsTableRenderer = this.#tableRenderers.register("tactica", new TacticaTableRenderer({ title: "AH.ITEM.Skill", actions: CharacterSheet.getCompendiumTableActions("tactica", "tactica") }));

  /* -------------------------------------------------- */
  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    await super._preparePartContext(partId, context);
    switch (partId) {
      case "status": {
        context.equipment = this.actor.system.equipment.equipped;
        context.tables = [
          await this.#consumableTableRenderer.render(this.actor.getItemsByType("consumable")),
          await this.#classesTableRenderer.render(this.actor.getItemsByType("tactica").filter(it => it.system.data.type === "tacticaClass")),
          await this.#weaponsTableRenderer.render(this.actor.getItemsByType("tactica").filter(it => it.system.data.type === "tacticaWeapon")),
          await this.#skillsTableRenderer.render(this.actor.getItemsByType("tactica").filter(it => it.system.data.type === "tacticaSkill")),
        ];
        break;
      }
    }
    return context;
  }

  _attachPartListeners(partId, html, options) {
    super._attachPartListeners(partId, html, options);
    switch (partId) {
      case "status":
      {
        this.#tableRenderers.invokeAll("attachListeners", this, html);
        break;
      }

      case "sidebar": {
        break;
      }
    }
  }

  /* -------------------------------------------------- */

}
