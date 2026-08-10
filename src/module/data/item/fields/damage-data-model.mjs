import FieldsetDataModel from "../../api/fieldset-data-model.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import AH from "../../../config.mjs";
import { TraitsField } from "./_module.mjs";
import { FoundryUtils } from "../../../utils/_module.mjs";

// TODO: Add secondary damage component support

/**
 * @description Used when rolls are performed.
 * @property {DamageUnit} primary
 * @property {DamageUnit} secondary
 * @property {TraitsField} traits
 */
export default class DamageDataModel extends FieldsetDataModel {
  static defineSchema() {
    const { BooleanField, SchemaField, NumberField, StringField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      primary: new SchemaField({
        amount: new NumberField({ initial: AH.defaults.damage.bonus, integer: true, nullable: false }),
        type: new StringField({ initial: "untyped", choices: Object.keys(AH.damageTypes), blank: true, nullable: false }),
      }),
      secondary: new SchemaField({
        amount: new NumberField({ initial: AH.defaults.damage.bonus, integer: true, nullable: true }),
        type: new StringField({ initial: "", blank: true, choices: Object.keys(AH.damageTypes), nullable: false }),
      }),
      traits: new TraitsField({
        options: FoundryUtils.getFormSelectOptions(AH.traits.damage),
      }),
    });
  }

  /**
   * @param {ActionConfig} config
   */
  configureAction(config) {
    if (this.enabled) {
      config.setDamage(this.primary.type, this.primary.amount);
      config.addTags({
        tag: AH.damageTypes[this.primary.type].long,
      });

      if (this.secondary.type) {
        config.modifyDamage(d => {
          d.add("AH.DAMAGE.Secondary", this.secondary.type, this.secondary.amount);
        });
        if (this.secondary.type !== this.primary.type) {
          config.addTags({
            tag: AH.damageTypes[this.secondary.type].long,
          });
        }
      }

      const traits = this.traits.values();
      config.addTraits(...traits);

    }
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/damage-data-model");
  }
}
