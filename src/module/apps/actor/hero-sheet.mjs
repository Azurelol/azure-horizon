import { AHActorSheet } from "./actor-sheet.mjs";
import { systemPath, systemTemplatePath } from "../../constants.mjs";
import { EquipmentDataModel } from "../../data/actor/system/_module.mjs";
import { AHBaseCharacterSheet } from "./base-character-sheet.mjs";
import { ArmorTableRenderer, AttackTableRenderer, WeaponTableRenderer } from "../item/_module.mjs";

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
    effects: {
      template: systemTemplatePath("sheets/document-effects"),
    },
  };

  /* -------------------------------------------------- */

  #weaponTableRenderer = new WeaponTableRenderer();
  #armorTableRenderer = new ArmorTableRenderer();

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    await super._preparePartContext(partId, context);
    switch (partId) {
      case "equipment":
        context.tables = [
          await this.#weaponTableRenderer.render(this.actor.getItemsByType("weapon")),
          await this.#armorTableRenderer.render(this.actor.getItemsByType("armor")),
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
    const type = item.type;
    console.debug(`Equipping ${type} ${item.name}`);
    switch (type) {
      case "weapon": {
        const data = this.actor.system.equipment.toggleWeapon(item);
        if (data) {
          await this.actor.update({ "system.equipment": data });
        }
      }

        break;
    }
  }

}
