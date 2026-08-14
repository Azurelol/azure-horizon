import ItemDataModel from "./item-data-model.mjs";
import { CheckDataModel } from "./fields/_module.mjs";
import Checks from "../../pipelines/checks.mjs";
import { ActionConfig } from "../../helpers/action-configuration.mjs";
import { Actions } from "../../pipelines/_module.mjs";

/**
 * A character-facing feature.
 * @property {CheckDataModel} check
 */
export default class FeatureDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      check: new EmbeddedDataField(CheckDataModel, { }),
    });
  }

  /**
   * @param {KeyboardModifiers} modifiers
   * @returns {Promise<boolean>}
   */
  async perform(modifiers) {
    if (this.check.enabled) {
      await Checks.actionCheck(this.parent.actor, this.parent, async (check, actor, item) => {
        const config = new ActionConfig(check);
        config.setAttributes(this.check.primary, this.check.secondary);
        config.setTargetedDefense(this.check.defense);
        await this._initializeAction(config);
      });
    }
    else {
      await Actions.perform(this.parent.actor, this.parent, async (config, actor, item) => {
        await this._initializeAction(config);
      });
    }

    return true;
  }

  /**
   * @param {ActionConfig} config
   * @protected
   * @return {Promise}
   */
  async _initializeAction(config) {
    config.addDescription(this.description);
  }
}
