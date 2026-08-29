import { AHActorSheet } from "./actor-sheet.mjs";
import { systemPath, systemTemplatePath } from "../../constants.mjs";
import { CharacterSheet } from "./character-sheet.mjs";
import {
  AccessoryTableRenderer, ActionTableRenderer,
  ArmorTableRenderer,
  WeaponTableRenderer,
} from "../item/_module.mjs";
import { FoundryUtils, StringUtils } from "../../utils/_module.mjs";
import AH from "../../config.mjs";

/**
 * @extends AHActorSheet
 * @property {AHActor} actor
 * @property {FollowerDataModel} system
 * @inheritDoc
 */
export class EntitySheet extends AHActorSheet {

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ah-entity"],
    actions: {
    },
  };

  /** @inheritdoc */
  static TABS = {
    primary: {
      tabs: [
        { id: "overview", label: "AH.SHEET.Tabs.Overview", icon: "ra ra-fluffy-swirl" },
      ],
      initial: "overview",
    },
  };

  /** @inheritdoc */
  static PARTS = {
    ...super.PARTS,

    header: {
      template: systemTemplatePath("sheets/actor/entity/entity-header"),
    },
    overview: {
      template: systemTemplatePath("sheets/actor/entity/entity-overview"),
    },
  };

  /* -------------------------------------------------- */
  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    await super._preparePartContext(partId, context);
    switch (partId) {
      case "overview": {
        break;
      }
    }
    return context;
  }

  /* -------------------------------------------------- */

}
