import WeaponUsageDataModel from "./fields/weapon-usage-data-model.mjs";
import { EffectsDataModel } from "./fields/effects-data-model.mjs";
import ActiveFeatureDataModel from "./active-feature-data-model.mjs";
import AH from "../../config.mjs";
import { isActorType } from "../../constants.mjs";

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
        current: new NumberField({ initial: 1, min: 1, integer: true, nullable: false, label: "AH.FIELD.Current", icon: AH.icons.current, _part: "settings" }),
        max: new NumberField({ initial: 1, min: 1, integer: true, nullable: false, label: "AH.FIELD.Maximum", icon: AH.icons.max, _part: "settings" }),
      }),
      usage: new EmbeddedDataField(WeaponUsageDataModel, {}),
    });
  }

  /**
   * @param {ActionConfig} config
   * @returns {Promise<void>}
   * @private
   */
  async _initializeAction(config) {
    await super._initializeAction(config);
    this.usage.configureAction(config);

    // TODO: Refactor
    /** @type AHActor **/
    const actor = this.parent.actor;
    if (isActorType(actor) && (actor.type === "hero")) {
      /** @type HeroDataModel **/
      const heroData = actor.system;
      const equipment = heroData.getEquippedItems();
      if (equipment) {
        const weapon = equipment.mainHand;
        /** @type WeaponDataModel **/
        const weaponData = weapon.system;
        config.setItemReference(weapon);
        if (this.usage.check) {
          config.setAttributes(weaponData.check.primary, weaponData.check.secondary);
        }
        if (this.usage.damage) {
          config.modifyDamage(d => {
            d.add("AH.DAMAGE.Weapon", weaponData.damage.primary.type, weaponData.damage.primary.amount);
          });
          config.addTraits(weaponData.damage.primary.type);
          config.addTags({
            tag: AH.damageTypes[weaponData.damage.primary.type].long,
          });
        }
      }
    }
  }
}
