import { systemTemplatePath } from "../../../constants.mjs";
import AH from "../../../config.mjs";
import { TraitsField } from "./_module.mjs";
import { FoundryUtils } from "../../../utils/_module.mjs";
import OptionalFieldsetDataModel from "../../api/optional-fieldset-data-model.mjs";

/**
 * @description Used when rolls are performed.
 * @property {DamageUnit} primary
 * @property {DamageUnit} secondary
 * @property {TraitsField} traits
 * @property {AH_Grade} grade
 */
export default class DamageDataModel extends OptionalFieldsetDataModel {

  static PRIMARY_DAMAGE_LABEL = "AH.DAMAGE.Damage";
  static SECONDARY_DAMAGE_LABEL = "AH.DAMAGE.Secondary";

  static defineSchema() {
    const { BooleanField, SchemaField, NumberField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      primary: new SchemaField({
        amount: new StringField({ initial: "", integer: true, nullable: false }),
        type: new StringField({ initial: "untyped", choices: Object.keys(AH.damageTypes), blank: true, nullable: false }),
      }),
      secondary: new SchemaField({
        amount: new StringField({ initial: "", integer: true, nullable: true }),
        type: new StringField({ initial: "", blank: true, choices: Object.keys(AH.damageTypes), nullable: false }),
      }),
      traits: new TraitsField({
        options: FoundryUtils.getFormSelectOptions(AH.traits.damage),
      }),
    });
  }

  static migrateData(source) {
    if (!(source.power in AH.power)) {
      source.power = "";
    }
    return super.migrateData(source);
  }

  /**
   * @param {ActionConfig} config
   * @param options
   */
  configureAction(config, options = {}) {
    const label = options.label ?? DamageDataModel.PRIMARY_DAMAGE_LABEL;
    if (this.active) {

      config.addTraits(this.primary.type);
      const traits = this.traits.values();
      config.addTraits(...traits);

      // If there's
      if (config.hasDamage) {
        config.modifyDamage(dmg => {
          dmg.add(label, this.primary);
          if (this.secondary.type) {
            config.addTraits(this.secondary.type);
            dmg.add(label, this.secondary);
          }
        });
      }
      // Adding damage
      else {
        config.setDamage(this.primary, this.grade);
        if (this.secondary.type) {
          config.modifyDamage(d => {
            d.add(DamageDataModel.SECONDARY_DAMAGE_LABEL, this.secondary);
          });
          if (this.secondary.type !== this.primary.type) {
            config.addTraits(this.secondary.type);
          }
        }
      }

    }
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/damage-data-model");
  }
}
