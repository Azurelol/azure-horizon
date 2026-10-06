import AH from "../../config.mjs";
import { TacticaEmptyData } from "./tactica/_module.mjs";
import ItemDataModel from "./item-data-model.mjs";
import Checks from "../../pipelines/checks.mjs";
import { ActionConfig } from "../../helpers/action-configuration.mjs";
import { Actions } from "../../pipelines/_module.mjs";

/**
 * @typedef {'tacticaWeapon'|'tacticaSkill'|'tacticaClass'|'tacticaConsumable'} AH_TacticaItemType
 */

/**
 * Used by units in the tactica sub-system.
 * @property {TacticaTypeDataModel} data The instantiated tactica data.
 * @property {AH_TacticaItemType} data.type
 */
export default class TacticaItemDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, TypedSchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      data: new TypedSchemaField(AH.dataModelRegistries.tacticaData.types, {
        initial: new TacticaEmptyData(),
        _part: "default",
      }),
    });
  }

  // TODO: Remove later
  static migrateData(source) {
    switch (source.data.type) {
      case "tacticaClassData":
        source.data.type = "tacticaClass";
        break;
      case "tacticaWeaponData":
        source.data.type = "tacticaWeapon";
        break;
      case "tacticaEmptyData":
        source.data.type = "tacticaEmpty";
        break;
      case "tacticaSkillData":
        source.data.type = "tacticaSkill";
        break;
      case "tacticaConsumableData":
        source.data.type = "tacticaConsumable";
        break;
    }
    return super.migrateData(source);
  }

  /**
   * @param {String} type
   */
  async changeType(type) {
    if (type === this.data.type) {
      return;
    }
    const model = AH.dataModelRegistries.tacticaData.types[type];
    if (model) {
      const feature = new model();
      if (feature) {
        await this.parent.update({ "system.data": foundry.data.operators.ForcedReplacement.create({
          type: type,
        }) });
      }
    }
    else {
      ui.notifications.warn(`Failed to retrieve data model for type ${type}`);
    }
  }

  /**
   * @param {KeyboardModifiers} modifiers
   * @returns {Promise<boolean>}
   */
  async perform(modifiers) {
    switch (this.data.type) {
      case "tacticaWeapon":
        await Checks.actionCheck(this.parent.actor, this.parent, async (check, actor, item) => {
          const config = new ActionConfig(check);
          config.setKeyboardModifiers(modifiers);
          config.addDescription(this.description);
          this.data.configureAction(config);
        });
        return true;

      case "tacticaSkill":
      case "tacticaClass":
        return false;

      case "tacticaConsumable":
        await Actions.perform(this.parent.actor, this.parent, async (config, actor, item) => {
          config.setKeyboardModifiers(modifiers);
          config.addDescription(this.description);
          this.data.configureAction(config);
        });
        return true;
    }
  }
}
