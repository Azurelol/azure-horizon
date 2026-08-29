import { AHActorSheet } from "./actor-sheet.mjs";
import { systemTemplatePath } from "../../constants.mjs";
import { CharacterSheet } from "./character-sheet.mjs";
import {
  ActionTableRenderer,

} from "../item/_module.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";

/**
 * @extends AHActorSheet
 * @property {AHActor} actor
 * @property {FollowerDataModel} system
 * @inheritDoc
 */
export class FollowerSheet extends AHActorSheet {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ah-follower"],
    actions: {
    },
  };

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "features", label: "AH.SHEET.Tabs.Features", icon: "ra ra-fluffy-swirl" },
        { id: "profile", label: "AH.SHEET.Tabs.Profile", icon: "ra ra-campfire" },
        { id: "effects", label: "AH.SHEET.Tabs.Effects", icon: "ra ra-book" },
      ],
      initial: "features",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    ...super.PARTS,

    header: {
      template: systemTemplatePath("sheets/actor/entity/follower-header"),
    },
    features: {
      template: systemTemplatePath("sheets/actor/character/character-features"),
    },
    profile: {
      template: systemTemplatePath("sheets/actor/character/character-profile"),
    },
    effects: {
      template: systemTemplatePath("sheets/document-effects"),
    },
  };

  /* -------------------------------------------------- */
  #moveTableRenderer = new ActionTableRenderer({ title: "AH.FOLLOWER.Move.plural", actions: CharacterSheet.getCompendiumTableActions("followers", "move") });

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    await super._preparePartContext(partId, context);
    switch (partId) {
      case "header":
      {
        context.actors = FoundryUtils.getOwnedActors("hero");
        context.actorOptions = FoundryUtils.fromValuesToFormSelectOptions(context.actors, a => a.name, a => a.id);
        break;
      }

      case "features": {
        context.tables = [
          await this.#moveTableRenderer.render(this.actor.getItemsByType("move")),
        ];
        break;
      }

      case "sidebar": {
        break;
      }
    }
    return context;
  }

  /* -------------------------------------------------- */

}
