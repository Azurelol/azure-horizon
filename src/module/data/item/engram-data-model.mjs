import EquipmentDataModel from "./equipment-data-model.mjs";
import { VersionedDataModel } from "../api/versioned-data-model.mjs";
import AH from "../../config.mjs";
import { ActionDataModel } from "./fields/action-data-model.mjs";
import { ActionCostDataModel } from "./fields/action-cost-data-model.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import ResourceDataModel from "./fields/resource-data-model.mjs";
import { DamageDataModel } from "./fields/_module.mjs";
import { systemTemplatePath } from "../../constants.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";

const { SchemaField, StringField, EmbeddedDataField, ForeignDocumentField, NumberField } = foundry.data.fields;

/**
 * @property {ActionDataModel} action
 * @property {DamageDataModel} damage
 * @property {ResourceDataModel} resource
 * @property {EffectsDataModel} effects
 * @property {ActionCostDataModel} cost
 */
export class EngramActionDataModel extends VersionedDataModel {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      name: new StringField({}),
      action: new EmbeddedDataField(ActionDataModel, {}),
      cost: new EmbeddedDataField(ActionCostDataModel, {}),
      effects: new EmbeddedDataField(EffectsDataModel, {}),
      damage: new EmbeddedDataField(DamageDataModel, {}),
      resource: new EmbeddedDataField(ResourceDataModel, {}),
    });
  }
}

/**
 * An engram is an item that allows the user to cast magic or perform certain abilities they could not otherwise.
 * @property {Number} level.current
 * @property {Number} level.max
 * @property {EngramActionDataModel} first
 * @property {EngramActionDataModel} second
 * @property {EngramActionDataModel} third
 */
export default class EngramDataModel extends EquipmentDataModel {
  /** @inheritdoc */
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      level: new SchemaField({
        current: new NumberField({ initial: 1, min: 1, integer: true, nullable: false, label: "AH.FIELD.CurrentLevel", icon: AH.icons.current, _part: "header" }),
        max: new NumberField({ initial: 1, min: 1, integer: true, nullable: false, label: "AH.FIELD.MaximumLevel", icon: AH.icons.max, _part: "header" }),
      }),
      first: new EmbeddedDataField(EngramActionDataModel, {
        config: false,
      }),
      second: new EmbeddedDataField(EngramActionDataModel, {
        config: false,
      }),
      third: new EmbeddedDataField(EngramActionDataModel, {
        config: false,
      }),
    });
  }

  async preparePartContext(sheet, partId, context) {
    await super.preparePartContext(sheet, partId, context);
    switch (partId) {
      case "properties": {
        context.levelTabs = sheet._prepareTabs("engram");
      }
        break;
    }
  }

  // TODO: Optimize
  /**
   * @returns {boolean} Whether this engram is currently slotted into a character's equipment.
   */
  get slotted() {
    if (this.parent.actor && (this.parent.actor.type === "hero")) {
      const system = this.parent.actor.system;
      const equipped = system.getEquippedItems();
      if (equipped?.engrams?.find(e => e.id === this.parent.id)) {
        return true;
      }
    }
    return false;
  }

  static get templates() {
    return {
      properties: [
        systemTemplatePath("sheets/item/model/engram-data-model"),
        systemTemplatePath("sheets/item/model/engram-level-partial"),
      ],
    };
  }

  get transferEffects() {
    return this.slotted;
  }
}
