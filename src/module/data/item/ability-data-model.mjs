import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import ActiveFeatureDataModel from "./active-feature-data-model.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import WeaponUsageDataModel from "./fields/weapon-usage-data-model.mjs";
import { assertCondition, isActorType } from "../../constants.mjs";
import { ActionDataModel } from "./fields/action-data-model.mjs";

/**
 * Abilities belong to adversaries and are their equivalent of PC skills.
 * @inheritDoc
 * @extends ActiveFeatureDataModel
 * @property {CheckDataModel} check
 * @property {DamageDataModel} damage
 * @property {ResourceDataModel} resource
 * @property {EffectsDataModel} effects
 * @property {WeaponUsageDataModel} usage
 * @property {AH_Intent} intent The intent behind this ability.
 * @property {AH_Weight} weight The weight for this item when selected against other items of its intent.
 */
export default class AbilityDataModel extends ActiveFeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      intent: new StringField({ initial: "",
        choices: Object.keys(AH.intents),
        formOptions: getFormSelectOptions(AH.intents),
        blank: true,
        nullable: false,
        label: "AH.ADVERSARY.Intent",
        _part: "header",
      }),
      weight: new StringField({ initial: "",
        choices: Object.keys(AH.weights),
        formOptions: getFormSelectOptions(AH.weights),
        blank: true,
        nullable: false,
        label: "AH.ADVERSARY.Weight",
        _part: "header",
      }),
      action: new EmbeddedDataField(ActionDataModel, {}),
      usage: new EmbeddedDataField(WeaponUsageDataModel, {}),
    });
  }

  get isCheck() {
    return super.isCheck || this.usage.check;
  }

  /**
   * @param {ActionConfig} config
   * @returns {Promise<void>}
   * @private
   */
  async _initializeAction(config) {
    await super._initializeAction(config);
    await this.action.configureAction(config);
    this.usage.configureAction(config);
    const actor = this.parent.actor;
    if (isActorType(actor)) {
      const attack = await this.resolveAttack();
      if (assertCondition(attack !== undefined, "An attack must be assigned for this ability.")) {
        config.setItemReference(attack);
        // Override check
        if (this.isCheck && this.usage.check) {
          config.setTargetedDefense(attack.system.check.defense);
        }
        // Override damage
        if (this.usage.damage) {
          attack.system.damage.configureAction(config, {
            label: "AH.ITEM.Attack",
          });
        }
        // Override attributes
        if (this.usage.attributes) {
          attack.system.attributes.configureAction(config, {});
        }
        // Use attack range
        config.removeTraits("melee", "ranged");
        config.addTraits(attack.system.range);
      }
    }
  }

  /**
   * @returns {AHItem}
   */
  async resolveAttack() {
    /** @type AHActor **/
    const actor = this.parent.actor;
    const attacks = actor.getItemsByType("attack");
    // TODO: Selector?
    const attack = attacks[0];
    return attack;
  }
}
