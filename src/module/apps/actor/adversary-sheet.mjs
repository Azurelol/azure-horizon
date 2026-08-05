import { AHActorSheet } from "./actor-sheet.mjs";
import { systemPath, systemTemplatePath } from "../../constants.mjs";
import Handlebars from "../../helpers/handlebars.mjs";
import { AttackTableRenderer, EquipmentTableRenderer } from '../item/_module.mjs';
import { EquipmentDataModel } from "../../data/actor/system/_module.mjs";
import { AHBaseCharacterSheet } from "./base-character-sheet.mjs";

/**
 * @extends AHActorSheet
 * @property {AHActor} actor
 * @property {AdversaryDataModel} system
 * @inheritDoc
 */
export class AHAdversarySheet extends AHBaseCharacterSheet {

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "features", label: "AH.SHEET.Tabs.Features", icon: "ra ra-fluffy-swirl" },
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
    effects: {
      template: systemTemplatePath("sheets/document-effects"),
    },
  };

  /* -------------------------------------------------- */
  #attackTableRenderer = new AttackTableRenderer();

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    await super._preparePartContext(partId, context);
    switch (partId) {
      case "features":
        context.tables = [
          await this.#attackTableRenderer.render(this.actor.getItemsByType('attack'))
        ];
        break;
    }
    return context;
  }

}
