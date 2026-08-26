import { AHActorSheet } from "./actor-sheet.mjs";
import { systemTemplatePath } from "../../constants.mjs";
import { ActionTableRenderer, AttackTableRenderer, EquipmentTableRenderer } from "../item/_module.mjs";
import { CharacterSheet } from "./base-character-sheet.mjs";
import { Migrations } from "../../helpers/_module.mjs";

/**
 * @extends AHActorSheet
 * @property {AHActor} actor
 * @property {AdversaryDataModel} system
 * @inheritDoc
 */
export class AdversarySheet extends CharacterSheet {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    window: {
      controls: [
        {
          action: "migrateActor",
          icon: "fa-regular fa-people",
          label: "AH.COMMON.MigrateActor",
          ownership: "OWNER",
        },
      ],
    },
    actions: {
      migrateActor: this.#migrateActor,
    },
  };

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "features", label: "AH.SHEET.Tabs.Features", icon: "ra ra-fluffy-swirl" },
        { id: "profile", label: "AH.SHEET.Tabs.Profile", icon: "ra ra-campfire" },
        { id: "assembly", label: "AH.SHEET.Tabs.Assembly", icon: "ra ra-monster-skull" },
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
      template: systemTemplatePath("sheets/actor/character/adversary-assembly"),
    },
  };

  /* -------------------------------------------------- */
  #attackTableRenderer = new AttackTableRenderer({ title: "AH.ADVERSARY.Attack.plural", actions: CharacterSheet.getCompendiumTableActions("assembly", "attack") });
  #abilityTableRenderer = new ActionTableRenderer({ title: "AH.ADVERSARY.Ability.plural", actions: CharacterSheet.getCompendiumTableActions("assembly", "ability") });

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

  /**
   * @this AHActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #migrateActor(event, target) {
    return Migrations.migrateActor(this.actor);
  }

}
