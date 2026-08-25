import ItemDataModel from "./item-data-model.mjs";
import { CheckDataModel } from "./fields/_module.mjs";
import Checks from "../../pipelines/checks.mjs";
import { ActionConfig } from "../../helpers/action-configuration.mjs";
import { Actions } from "../../pipelines/_module.mjs";
import { ActionAttributesDataModel } from "./fields/action-attributes-data-model.mjs";

/**
 * A character-facing feature.
 * @property {ActionAttributesDataModel} attributes
 * @property {CheckDataModel} check
 */
export default class FeatureDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      attributes: new EmbeddedDataField(ActionAttributesDataModel, {}),
      check: new EmbeddedDataField(CheckDataModel, { }),
    });
  }

  /**
   * @returns {Boolean}
   */
  get isCheck() {
    return this.check.enabled;
  }

  /**
   * @param {KeyboardModifiers} modifiers
   * @returns {Promise<boolean>}
   */
  async perform(modifiers) {
    if (this.isCheck) {
      await Checks.actionCheck(this.parent.actor, this.parent, async (check, actor, item) => {
        const config = new ActionConfig(check);
        await this._initializeCheck(config);
        await this._initializeAction(config);
      });
    }
    else {
      await Actions.perform(this.parent.actor, this.parent, async (config, actor, item) => {
        /** @type CharacterDataModel **/
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
  async _initializeCheck(config) {
    config.setTargetedDefense(this.check.defense);
  }

  /**
   * @param {ActionConfig} config
   * @protected
   * @return {Promise}
   */
  async _initializeAction(config) {
    this.attributes.configureAction(config);
    config.setDefaultTargets();
    config.addDescription(this.description);
  }
}
