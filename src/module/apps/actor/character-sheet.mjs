import { AHActorSheet } from "./actor-sheet.mjs";
import { systemPath, systemTemplatePath } from "../../constants.mjs";
import Handlebars from "../../helpers/handlebars.mjs";
import { AttackTableRenderer, EquipmentTableRenderer } from '../item/_module.mjs';
import { EquipmentDataModel } from "../../data/actor/system/_module.mjs";
import { AHBaseCharacterSheet } from "./base-character-sheet.mjs";

/**
 * @extends AHActorSheet
 * @property {AHActor} actor
 * @property {CharacterDataModel} system
 * @inheritDoc
 */
export class AHCharacterSheet extends AHBaseCharacterSheet {

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

  #equipmentTableRenderer = new EquipmentTableRenderer();
  #attackTableRenderer = new AttackTableRenderer();


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
        context.tables = [
          await this.#attackTableRenderer.render(this.actor.getItemsByType('weapon'))
        ]
        break;
    }
    return context;
  }

}
