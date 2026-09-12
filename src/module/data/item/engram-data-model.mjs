import EquipmentDataModel from "./equipment-data-model.mjs";
import { VersionedDataModel } from "../api/versioned-data-model.mjs";
import AH from "../../config.mjs";
import { ActionDataModel } from "./fields/action-data-model.mjs";
import { ActionCostDataModel } from "./fields/action-cost-data-model.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import ResourceDataModel from "./fields/resource-data-model.mjs";
import { CheckDataModel, DamageDataModel } from "./fields/_module.mjs";
import { isActorType, systemTemplatePath } from "../../constants.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import { Actions } from "../../pipelines/_module.mjs";
import { ActionAttributesDataModel } from "./fields/action-attributes-data-model.mjs";
import Checks from "../../pipelines/checks.mjs";
import { ActionConfig } from "../../helpers/action-configuration.mjs";

const { SchemaField, StringField, EmbeddedDataField, HTMLField, NumberField } = foundry.data.fields;

/**
 * @property {ActionAttributesDataModel} attributes
 * @property {CheckDataModel} check
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
      description: new HTMLField({
        label: "AH.ITEM.Description",
      }),
      attributes: new EmbeddedDataField(ActionAttributesDataModel, {}),
      check: new EmbeddedDataField(CheckDataModel, { }),
      action: new EmbeddedDataField(ActionDataModel, {}),
      cost: new EmbeddedDataField(ActionCostDataModel, {}),
      effects: new EmbeddedDataField(EffectsDataModel, {}),
      damage: new EmbeddedDataField(DamageDataModel, {}),
      resource: new EmbeddedDataField(ResourceDataModel, {}),
    });
  }

  /**
   * @param {KeyboardModifiers} modifiers
   * @returns {Promise<boolean>}
   */
  async perform(modifiers) {
    const actor = this.parent.parent.actor;
    const item = this.parent.parent;
    if (isActorType(actor)) {
      if (this.check.enabled) {
        await Checks.actionCheck(actor, item, async (check, actor, item) => {
          const config = new ActionConfig(check);
          config.setTargetedDefense(this.check.defense);
          await this._initializeAction(config);
        });
      }
      else {
        await Actions.perform(actor, item, async (config, actor, item) => {
          await this._initializeAction(config);
        });
      }
    }
  }

  /**
   * @param {ActionConfig} config
   * @protected
   * @return {Promise}
   */
  async _initializeAction(config) {
    this.attributes.configureAction(config);
    config.setDefaultTargets();
    config.setLabel(this.name);
    config.addDescription(this.description);
    await this.damage.configureAction(config);
    await this.resource.configureAction(config);
    await this.effects.configureAction(config);
    await this.cost.configureAction(config);
    await this.action.configureAction(config);
  }
}

/**
 * An engram is an item that allows the user to cast magic or perform certain abilities they could not otherwise.
 * @property {AH_EngramKind} kind
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
      kind: new StringField({ initial: "magic", blank: true, choices: () => AH.engrams, _part: "header", label: "AH.FIELD.Kind" }),
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
        if (this.level.max < 3) {
          delete context.levelTabs.third;
        }
        if (this.level.max < 2) {
          delete context.levelTabs.second;
        }
      }
        break;
    }
  }

  /**
   * @return {EngramActionDataModel[]}
   */
  get available() {
    let result = [this.first];
    if (this.level.max >= 3) {
      result.push(this.third);
    }
    if (this.level.max >= 2) {
      result.push(this.second);
    }
    return result;
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
