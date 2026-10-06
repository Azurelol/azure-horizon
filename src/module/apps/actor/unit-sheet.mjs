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
import { ActionHandler } from "../ui/_module.mjs";
import { EntitySheet } from "./entity-sheet.mjs";
import { Formulas } from "../../ruleset/_module.mjs";

/**
 * @property {AHActor} actor
 * @property {UnitDataModel} system
 * @inheritDoc
 */
export class UnitSheet extends EntitySheet {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      equipItem: this.#equipItem,
      rest: this.#rest,
    },
    position: {
      width: 720,
      height: 800,
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
    header: {
      template: systemTemplatePath("sheets/actor/unit/unit-header"),
      templates: [
        systemTemplatePath("sheets/actor/character/character-partial-actions"),
        systemTemplatePath("sheets/actor/character/character-partial-effects"),
      ],
    },
    status: {
      template: systemTemplatePath("sheets/actor/unit/unit-status"),
    },
  };

  /* -------------------------------------------------- */

  #tableRenderers = new TableRendererRegistry();
  #consumableTableRenderer = this.#tableRenderers.register("consumable", new ActionTableRenderer({ title: "AH.ITEM.Consumable", actions: CharacterSheet.getCompendiumTableActions("equipment", "consumable") }));
  #classesTableRenderer = this.#tableRenderers.register("tactica", new TacticaClassTableRenderer({ title: "AH.ITEM.Class.long", actions: CharacterSheet.getCompendiumTableActions("tactica", "tactica") }));
  #weaponsTableRenderer = this.#tableRenderers.register("tactica", new TacticaWeaponTableRenderer({ title: "AH.ITEM.Weapon", actions: CharacterSheet.getCompendiumTableActions("tactica", "tactica") }));
  #skillsTableRenderer = this.#tableRenderers.register("tactica", new TacticaTableRenderer({ title: "AH.ITEM.Skill", actions: CharacterSheet.getCompendiumTableActions("tactica", "tactica") }));

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

  /**
   * @returns {UnitDataModel}
   */
  get system() {
    return this.actor.system;
  }

  /* -------------------------------------------------- */
  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    await super._preparePartContext(partId, context);
    switch (partId) {

      case "header": {
        context.blk = Formulas.calculateBlock(this.actor.system).hp;
        context.rec = Formulas.calculateRecovery(this.actor.system).hp;
        context.mov = Formulas.calculateMovement(this.actor);
        context.actions = this.actionHandler.getMenuActions();
        break;
      }

      case "status": {
        context.equipment = this.actor.system.equipment.equipped;
        context.tables = [
          await this.#consumableTableRenderer.render(this.actor.getItemsByType("tactica").filter(it => it.system.data.type === "tacticaConsumable")),
          await this.#classesTableRenderer.render(this.actor.getItemsByType("tactica").filter(it => it.system.data.type === "tacticaClass")),
          await this.#weaponsTableRenderer.render(this.actor.getItemsByType("tactica").filter(it => it.system.data.type === "tacticaWeapon")),
          await this.#skillsTableRenderer.render(this.actor.getItemsByType("tactica").filter(it => it.system.data.type === "tacticaSkill")),
        ];
        break;
      }

      case "effects":
        context.modifiers = this.actor.system.parameters.summarizeModifiers();
        break;
    }
    return context;
  }

  _attachPartListeners(partId, html, options) {
    super._attachPartListeners(partId, html, options);
    switch (partId) {
      case "header": {
        this.actionHandler.setupMenu(html);
        break;
      }
      case "status":
      {
        this.actionHandler.setupEquipment(html);
        this.#tableRenderers.invokeAll("attachListeners", this, html);
        break;
      }
    }
  }

  /* -------------------------------------------------- */
  /**
   * @this UnitSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #rest(event, target) {
    const { type } = target.dataset;
    return this.actor.rest(type);
  }

  /**
   * @this UnitSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #equipItem(event, target) {
    const { id, slot } = target.dataset;
    const item = this.actor.items.get(id);
    if (item) {
      return this.system.equipItem(item, slot);
    }
  }

  /* -------------------------------------------------- */

}
