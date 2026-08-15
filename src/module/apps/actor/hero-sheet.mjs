import { AHActorSheet } from "./actor-sheet.mjs";
import { systemPath, systemTemplatePath } from "../../constants.mjs";
import { AHBaseCharacterSheet } from "./base-character-sheet.mjs";
import {
  AccessoryTableRenderer, ActionTableRenderer,
  ArmorTableRenderer,
  WeaponTableRenderer,
} from "../item/_module.mjs";
import { StringUtils } from "../../utils/_module.mjs";
import AH from "../../config.mjs";

/**
 * @extends AHActorSheet
 * @property {AHActor} actor
 * @property {HeroDataModel} system
 * @inheritDoc
 */
export class HeroSheet extends AHBaseCharacterSheet {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    actions: {
      equipItem: this.#equipItem,
    },
  };

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "features", label: "AH.SHEET.Tabs.Features", icon: "ra ra-fluffy-swirl" },
        { id: "equipment", label: "AH.SHEET.Tabs.Equipment", icon: "ra ra-double-team" },
        { id: "profile", label: "AH.SHEET.Tabs.Profile", icon: "ra ra-campfire" },
        { id: "parameters", label: "AH.SHEET.Tabs.Parameters", icon: "ra ra-circle-of-circles" },
        { id: "effects", label: "AH.SHEET.Tabs.Effects", icon: "ra ra-book" },
      ],
      initial: "features",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    ...super.PARTS,

    features: {
      template: systemTemplatePath("sheets/actor/character/character-features"),
    },
    equipment: {
      template: systemTemplatePath("sheets/actor/character/character-equipment"),
    },
    profile: {
      template: systemTemplatePath("sheets/actor/character/character-profile"),
    },
    parameters: {
      template: systemTemplatePath("sheets/actor/character/character-parameters"),
    },
    effects: {
      template: systemTemplatePath("sheets/document-effects"),
    },
  };

  /* -------------------------------------------------- */

  #skillTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.Skill" });
  #spellTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.Spell" });
  #weaponTableRenderer = new WeaponTableRenderer({ title: "AH.ITEM.Weapon" });
  #armorTableRenderer = new ArmorTableRenderer({ title: "AH.ITEM.Armor" });
  #accessoryTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.Accessory" });

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    await super._preparePartContext(partId, context);
    switch (partId) {
      case "header":
      {
        const defConfig = this.actor.system.getDefense("def");
        context.def = `${StringUtils.localize(AH.attributes[defConfig.primary].short)} + ${StringUtils.localize(AH.attributes[defConfig.secondary].short)}`;
        const mdefConfig = this.actor.system.getDefense("mdef");
        context.mdef = `${StringUtils.localize(AH.attributes[mdefConfig.primary].short)} + ${StringUtils.localize(AH.attributes[mdefConfig.secondary].short)}`;
        break;
      }

      case "features": {
        context.tables = [
          await this.#skillTableRenderer.render(this.actor.getItemsByType("skill")),
          await this.#spellTableRenderer.render(this.actor.getItemsByType("spell")),
        ];
        break;
      }

      case "sidebar": {
        context.equipment = this.actor.system.getEquippedItems();
        break;
      }
      case "equipment":
        context.tables = [
          await this.#weaponTableRenderer.render(this.actor.getItemsByType("weapon")),
          await this.#armorTableRenderer.render(this.actor.getItemsByType("armor")),
          await this.#accessoryTableRenderer.render(this.actor.getItemsByType("accessory")),
        ];
        break;
      case "parameters":
        context.modifiers = this.actor.system.parameters.summarizeModifiers();
        break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * @this HeroSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #equipItem(event, target) {
    const { id } = target.dataset;
    const item = this.actor.items.get(id);
    if (item) {
      this.actor.system.equipItem(item);
    }
  }

}
