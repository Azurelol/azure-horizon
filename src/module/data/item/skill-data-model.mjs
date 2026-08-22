import WeaponUsageDataModel from "./fields/weapon-usage-data-model.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import ActiveFeatureDataModel from "./active-feature-data-model.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import { assertCondition, isActorType } from "../../constants.mjs";
import { ActionDataModel } from "./fields/action-data-model.mjs";

/**
 * Skills belong to character classes and are selected and upgraded during a character's advancement
 * @inheritDoc
 * @extends ActiveFeatureDataModel
 * @property {String} class The slug of the class this skill belongs to.
 * @property {Number} level.current
 * @property {Number} level.max
 * @property {WeaponUsageDataModel} usage
 * @property {CheckDataModel} check
 * @property {DamageDataModel} damage
 * @property {ResourceDataModel} resource
 * @property {EffectsDataModel} effects
 * @property {AH_Power} power
 */
export default class SkillDataModel extends ActiveFeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      class: new StringField({
        label: "AH.FIELD.Class",
        _part: "header",
      }),
      level: new SchemaField({
        current: new NumberField({ initial: 1, min: 1, integer: true, nullable: false, label: "AH.FIELD.CurrentLevel", icon: AH.icons.current, _part: "header" }),
        max: new NumberField({ initial: 1, min: 1, integer: true, nullable: false, label: "AH.FIELD.MaximumLevel", icon: AH.icons.max, _part: "header" }),
      }),
      action: new EmbeddedDataField(ActionDataModel, {}),
      usage: new EmbeddedDataField(WeaponUsageDataModel, {}),
    });
  }

  get isCheck() {
    return super.isCheck || this.usage.check;
  }

  async _initializeAction(config, data) {
    await super._initializeAction(config);
    await this.action.configureAction(config);
    this.usage.configureAction(config);

    const actor = this.parent.actor;
    if (isActorType(actor)) {
      const weapon = await this.resolveWeapon();
      if (assertCondition(weapon !== undefined, "A weapon must be assigned for this skill.")) {
        config.setItemReference(weapon);
        // Override check
        if (this.isCheck && this.usage.check) {
          config.setTargetedDefense(weapon.system.check.defense);
        }
        // Override damage
        if (this.usage.damage) {
          weapon.system.damage.configureAction(config, {
            label: "AH.ITEM.Weapon",
          });
        }
        // Override attributes
        if (this.usage.attributes) {
          weapon.system.attributes.configureAction(config, {});
        }
        // Use weapon range
        config.removeTraits("melee", "ranged");
        config.addTraits(weapon.system.range);
      }
    }
  }

  /**
   * @returns {AHItem}
   */
  async resolveWeapon() {
    const actor = this.parent.actor;
    /** @type HeroDataModel **/
    const heroData = actor.system;
    const equipment = heroData.getEquippedItems();
    return equipment.mainHand;
  }

}
