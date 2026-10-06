import { systemTemplatePath } from "../../../constants.mjs";
import TacticaTypeDataModel from "../tactica-type-data-model.mjs";
import AH, { getFormSelectOptions } from "../../../config.mjs";
import { TraitsField } from "../fields/_module.mjs";
import { EffectsDataModel } from "../fields/effects-data-model.mjs";

/**
 * @property {AH_Tactica_Weapon} category
 * @property {Number} range.min
 * @property {Number} range.max
 * @property {Number} weight
 * @property {AH_DamageType} damage.type
 * @property {AH_Grade} damage.grade
 * @property {AH_Power} damage.power
 */
export default class TacticaWeaponData extends TacticaTypeDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "tacticaWeapon" });
  }

  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      category: new StringField({
        initial: "sword",
        _part: "header",
        label: "AH.FIELD.Category",
        choices: () => AH.tactica.weapon.category,
      }),
      range: new SchemaField({
        min: new NumberField({
          initial: 1,
          _part: "header",
          _classes: "ah-flex-shrink",
          label: "AH.TACTICA.RANGE.Minimum",
        }),
        max: new NumberField({
          initial: 1,
          _part: "header",
          _classes: "ah-flex-shrink",
          label: "AH.TACTICA.RANGE.Maximum",
        }),
      }),
      weight: new StringField({
        initial: "light",
        _part: "header",
        label: "AH.FIELD.Weight",
        choices: () => AH.equipmentWeight,
      }),
      damage: new SchemaField({
        type: new StringField({
          initial: "",
          choices: () => AH.tactica.damage,
          nullable: false,
          blank: true,
          label: "AH.FIELD.DamageType.long",
          _part: "properties",
        }),
        grade: new StringField({
          initial: "C",
          label: "AH.FIELD.Grade",
          choices: () => AH.grades,
          nullable: false }),
        power: new StringField({
          initial: "low",
          label: "AH.FIELD.Power",
          choices: Object.keys(AH.power),
          formOptions: getFormSelectOptions(AH.power),
          nullable: false,
          _part: "properties" }),
      }),
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        _part: "properties",
        formOptions: getFormSelectOptions(AH.tactica.weapon.traits),
      }),
    });
  }

  /**
   * @return {String}
   */
  static get localization() {
    return "AH.TACTICA.Weapon";
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
    let targetDefense;
    let primary, secondary;
    switch (this.category) {
      case "sword":
      case "axe":
      case "spear":
      case "bow":
      case "dagger":
        targetDefense = "def";
        primary = "mig";
        secondary = "dex";
        break;
      case "tome":
        targetDefense = "mdef";
        primary = "ins";
        secondary = "wlp";
        break;

    }

    config.setAttributes(primary, secondary);
    config.setDamage({
      amount: 0,
      type: this.damage.type,
      source: {
        label: config.check.itemName,
        icon: "primaryDamage",
      },
    });
    config.setGrade(this.damage.grade);
    config.setPower(this.damage.power);
    config.addTraits(this.category);
    config.addTraits(...this.traits);
    config.addTraits(this.damage.type);
    config.setTargetedDefense(targetDefense);
    config.setDefaultTargets();

    // TODO: Depending on the targets weapons/init, do extra stuff
  }

  /**
   * @return {String}
   */
  static get template() {
    return systemTemplatePath("sheets/item/tactica/tactica-weapon-data");
  }
}
