import { AHActorSheet } from "./actor-sheet.mjs";
import { systemPath, systemTemplatePath } from "../../constants.mjs";
import { ActionTableRenderer, AttackTableRenderer, EquipmentTableRenderer } from "../item/_module.mjs";
import { AHBaseCharacterSheet } from "./base-character-sheet.mjs";

/**
 * @extends AHActorSheet
 * @property {AHActor} actor
 * @property {AdversaryDataModel} system
 * @inheritDoc
 */
export class AdversarySheet extends AHBaseCharacterSheet {

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "features", label: "AH.SHEET.Tabs.Features", icon: "ra ra-fluffy-swirl" },
        { id: "profile", label: "AH.SHEET.Tabs.Profile", icon: "ra ra-campfire" },
        { id: "assembly", label: "AH.SHEET.Tabs.Assembly", icon: "ra ra-monster-skull" },
        { id: "parameters", label: "AH.SHEET.Tabs.Parameters", icon: "ra ra-aquarius" },
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
    profile: {
      template: systemTemplatePath("sheets/actor/character/character-profile"),
    },
    assembly: {
      template: systemTemplatePath("sheets/actor/character/character-assembly"),
    },
    parameters: {
      template: systemTemplatePath("sheets/actor/character/character-parameters"),
    },
    effects: {
      template: systemTemplatePath("sheets/document-effects"),
    },
  };

  /* -------------------------------------------------- */
  #attackTableRenderer = new AttackTableRenderer();
  #abilityTableRenderer = new ActionTableRenderer();

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    await super._preparePartContext(partId, context);
    switch (partId) {
      case "features":
        context.tables = [
          await this.#attackTableRenderer.render(this.actor.getItemsByType("attack")),
          await this.#abilityTableRenderer.render(this.actor.getItemsByType("ability")),
        ];
        break;

      case "assembly":{
        context.assembly = this.actor.system.profile.prepareAssemblyData();
        break;
      }

      case "parameters":
        context.modifiers = this.actor.system.parameters.summarizeModifiers();
        break;
    }
    return context;
  }

}
