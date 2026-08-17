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
 */
export default class DamageDataModel extends OptionalFieldsetDataModel {
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
    const label = options.label ?? "AH.DAMAGE.Damage";
    if (this.enabled) {

      config.addTraits(this.primary.type);
      const traits = this.traits.values();
      config.addTraits(...traits);

      if (config.hasDamage) {
        config.modifyDamage(dmg => {
          dmg.add(label, this.primary.type, this.primary.amount);
          if (this.secondary.type) {
            config.addTraits(this.secondary.type);
            dmg.add(label, this.secondary.type, this.secondary.amount);
          }
        });
      }
      else {
        config.addDamage(this.primary.type, this.primary.amount);
        if (this.secondary.type) {
          config.modifyDamage(d => {
            d.add("AH.DAMAGE.Secondary", this.secondary.type, this.secondary.amount);
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
