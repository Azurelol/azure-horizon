import ItemDataModel from "./item-data-model.mjs";
import { ActionConfig } from "../../helpers/action-configuration.mjs";
import { Actions } from "../../pipelines/_module.mjs";
import { DamageDataModel } from "./fields/_module.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import ResourceDataModel from "./fields/resource-data-model.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";

/**
 * A follower-facing feature. They require no checks and are simplified.
 *
 */
export default class MoveDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      damage: new EmbeddedDataField(DamageDataModel, {}),
      resource: new EmbeddedDataField(ResourceDataModel, {}),
      effects: new EmbeddedDataField(EffectsDataModel, {}),
    });
  }

  /**
   * @param {KeyboardModifiers} modifiers
   * @returns {Promise<boolean>}
   */
  async perform(modifiers) {
    await Actions.perform(this.parent.actor, this.parent, async (config, actor, item) => {
      await this.damage.configureAction(config);
      await this.resource.configureAction(config);
      await this.effects.configureAction(config);
    });
    return true;
  }
}
