import ActiveFeatureDataModel from "./active-feature-data-model.mjs";
import FeatureDataModel from "./feature-data-model.mjs";
import { CheckDataModel, DamageDataModel, TraitsField } from "./fields/_module.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import { ActionAttributesDataModel } from "./fields/action-attributes-data-model.mjs";

/**
 * Represents a damaging action in the system.
 * @property {AH_ActionRange} range
 * @property {CheckDataModel} check
 * @property {DamageDataModel} damage
 * @property {TraitsField} traits
 * @remarks This simpler model is used for adversaries.
 */
export default class AttackDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, HTMLField, NumberField, BooleanField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      attributes: new EmbeddedDataField(ActionAttributesDataModel, FoundryUtils.configureInitial(ActionAttributesDataModel, {
        required: true,
      })),
      check: new EmbeddedDataField(CheckDataModel, FoundryUtils.configureInitial(CheckDataModel, {
        required: true,
      })),
      damage: new EmbeddedDataField(DamageDataModel, FoundryUtils.configureInitial(DamageDataModel, {
        required: true,
      })),
      range: new StringField({
        initial: "melee",
        blank: false,
        label: "AH.FIELD.Range",
        _part: "header",
        choices: () => AH.traits.range,
      }),
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        _part: "header",
        formOptions: getFormSelectOptions(AH.traits.attack),
      }),
    });
  }

  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();
    this.attributes.required = true;
    this.check.required = true;
    this.damage.required = true;
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    config.addTraits(this.range);
    config.addTraits(Array.from(this.traits));
    config.addTags({
      tag: AH.actionTypes.action.label,
      value: AH.defaults.action.attack.cost,
    });
    await this.damage.configureAction(config);
  }
}
