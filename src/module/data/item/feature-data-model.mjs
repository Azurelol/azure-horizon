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
   * @returns {CheckDataModel}
   * @protected
   */
  async resolveCheckData() {
    return this.check;
  }

  /**
   * @param {KeyboardModifiers} modifiers
   * @returns {Promise<boolean>}
   */
  async perform(modifiers) {
    const checkData = await this.resolveCheckData();
    if (checkData.enabled) {
      await Checks.actionCheck(this.parent.actor, this.parent, async (check, actor, item) => {
        const config = new ActionConfig(check);
        config.setAttributes(this.attributes.primary, this.attributes.secondary);
        config.setTargetedDefense(checkData.defense);
        await this._initializeAction(config);
      });
    }
    else {
      await Actions.perform(this.parent.actor, this.parent, async (config, actor, item) => {
        /** @type CharacterDataModel **/
        const system = this.parent.actor.system;
        const attributes = system.attributes;
        config.setAttributes({
          attribute: this.attributes.primary,
          dice: attributes[this.attributes.primary].current,
        }, {
          attribute: this.attributes.secondary,
          dice: attributes[this.attributes.secondary].current,
        });
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
