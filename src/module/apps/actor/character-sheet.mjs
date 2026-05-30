import { AHActorSheet } from "./actor-sheet.mjs";
import { systemPath, systemTemplatePath } from "../../constants.mjs";

export class AHCharacterSheet extends AHActorSheet {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ah-character-sheet"],
    position: {
      width: 600,
      height: 600,
    },
    actions: {
    },
  };

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "overview", label: "AH.SHEET.Tabs.Overview", icon: "ra ra-double-team" },
        { id: "equipment", label: "AH.SHEET.Tabs.Inventory", icon: "ra ra-double-team" },
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
    tabs: {
      template: systemTemplatePath("sheets/document-tabs"),
    },
    properties: {
      template: systemTemplatePath("sheets/document-properties"),
    },
    items: {
      template: systemTemplatePath("sheets/actor/actor-items"),
    },
    effects: {
      template: systemTemplatePath("sheets/document-effects"),
    },
  };

  /* -------------------------------------------------- */

}
