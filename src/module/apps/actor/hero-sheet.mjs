import { AHActorSheet } from "./actor-sheet.mjs";
import { systemPath, systemTemplatePath } from "../../constants.mjs";
import { CharacterSheet } from "./base-character-sheet.mjs";
import {
  AccessoryTableRenderer, ActionTableRenderer,
  ArmorTableRenderer,
  WeaponTableRenderer,
} from "../item/_module.mjs";
import { StringUtils } from "../../utils/_module.mjs";
import AH from "../../config.mjs";
import Handlebars from "../../helpers/handlebars.mjs";

/**
 * @extends AHActorSheet
 * @property {AHActor} actor
 * @property {HeroDataModel} system
 * @inheritDoc
 */
export class HeroSheet extends CharacterSheet {

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
        { id: "advancement", label: "AH.SHEET.Tabs.Advancement", icon: "ra ra-player-lift" },
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
    advancement: {
      template: systemTemplatePath("sheets/actor/character/hero-advancement"),
    },
  };

  /* -------------------------------------------------- */

  #skillTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.Skill", actions: CharacterSheet.getCompendiumTableActions("classes", "skill") });
  #classFeatureTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.ClassFeature", actions: CharacterSheet.getCompendiumTableActions("classes", "classFeature") });
  #spellTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.Spell.long", actions: CharacterSheet.getCompendiumTableActions("spells") });
  #weaponTableRenderer = new WeaponTableRenderer({ title: "AH.ITEM.Weapon", actions: CharacterSheet.getCompendiumTableActions("equipment", "weapon") });
  #armorTableRenderer = new ArmorTableRenderer({ title: "AH.ITEM.Armor", actions: CharacterSheet.getCompendiumTableActions("equipment", "armor") });
  #accessoryTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.Accessory", actions: CharacterSheet.getCompendiumTableActions("equipment", "accessory") });
  #consumableTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.Consumable", actions: CharacterSheet.getCompendiumTableActions("equipment", "consumable") });

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
          await this.#classFeatureTableRenderer.render(this.actor.getItemsByType("classFeature")),
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
          await this.#consumableTableRenderer.render(this.actor.getItemsByType("consumable")),
        ];
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
