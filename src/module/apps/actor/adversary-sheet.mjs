import { AHActorSheet } from "./actor-sheet.mjs";
import { systemTemplatePath } from "../../constants.mjs";
import { ActionTableRenderer, AttackTableRenderer, EquipmentTableRenderer } from "../item/_module.mjs";
import { CharacterSheet } from "./character-sheet.mjs";
import { Migrations } from "../../helpers/_module.mjs";
import Intent from "../../pipelines/intent.mjs";

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
      setAttack: this.#setAttack,
    },
  };

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "features", label: "AH.SHEET.Tabs.Features", icon: "ra ra-fluffy-swirl" },
        { id: "assembly", label: "AH.SHEET.Tabs.Assembly", icon: "ra ra-monster-skull" },
        { id: "profile", label: "AH.SHEET.Tabs.Profile", icon: "ra ra-campfire" },
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

      case "header":{
        context.attack = this.actor.system.getAttack();
        break;
      }

      case "features":
        context.tables = [
          await this.#attackTableRenderer.render(this.actor.getItemsByType("attack")),
          await this.#abilityTableRenderer.render(this.actor.getItemsByType("ability")),
        ];
        break;

      case "profile":{

        break;
      }

      case "assembly":{
        context.assembly = this.actor.system.profile.prepareAssemblyData();
        context.intents = Intent.resolveIntents(this.actor.system);
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
  /**
   * @this AdversarySheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #setAttack(event, target) {
    const { id } = target.dataset;
    const item = this.actor.items.get(id);
    if (item) {
      await this.actor.system.setAttack(item);
    }
  }

}
