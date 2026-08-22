import AH, { getFormSelectOptions } from "../../config.mjs";
import ActiveFeatureDataModel from "./active-feature-data-model.mjs";
import { ActionDataModel } from "./fields/action-data-model.mjs";

/**
 * A spell is a feature tied to a magical domain.
 * @property {AH_Domain} domain Can also be empty for non-domain spells.
 * @property {AH_Speed} speed
 */
export default class SpellDataModel extends ActiveFeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      action: new EmbeddedDataField(ActionDataModel, {}),
      domain: new StringField({ initial: "",
        blank: true,
        label: "AH.FIELD.Domain",
        formOptions: getFormSelectOptions(AH.domains),
        _part: "header",
        choices: () => AH.domains }),
      speed: new StringField({
        blank: true,
        label: "AH.ACTION.Speed",
        initial: "instant",
        formOptions: getFormSelectOptions(AH.speed),
        _part: "header",
        choices: () => AH.speed,
        required: true }),
    });
  }

  async _initializeAction(config) {
    await super._initializeAction(config);
    await this.action.configureAction(config);
    config.addTraits("spell");
    if (this.domain) {
      config.addTraits(this.domain);
    }
    config.addTraits(this.speed);
  }
}
