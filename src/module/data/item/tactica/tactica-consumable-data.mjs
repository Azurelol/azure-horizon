import { systemTemplatePath } from "../../../constants.mjs";
import TacticaTypeDataModel from "../tactica-type-data-model.mjs";
import ResourceDataModel from "../fields/resource-data-model.mjs";
import AH from "../../../config.mjs";

/**
 * @property {Number} range.min
 * @property {Number} range.max
 * @property {ResourceDataModel} resource
 * @property {AH_Resource} cost.resource
 * @property {Number} cost.amount
 */
export default class TacticaConsumableData extends TacticaTypeDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "tacticaConsumable" });
  }

  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, TypedSchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      range: new SchemaField({
        minimum: new NumberField({
          initial: 1,
          nullable: false,
          _part: "properties",
          _classes: "ah-flex-shrink",
          label: "AH.TACTICA.RANGE.Minimum",
        }),
        maximum: new NumberField({
          initial: 1,
          nullable: false,
          _part: "properties",
          _classes: "ah-flex-shrink",
          label: "AH.TACTICA.RANGE.Maximum",
        }),
      }),
      cost: new SchemaField({
        resource: new StringField({
          initial: "ip",
          label: "AH.FIELD.Resource",
          blank: true,
          choices: () => AH.resourceTypes,
          nullable: false,
          required: true }),
        amount: new NumberField({
          initial: 0,
          label: "AH.FIELD.Amount",
          nullable: false,
        }),
      }, {
        label: "AH.FIELD.Cost",
        _part: "properties",
      }),
      resource: new SchemaField({
        type: new StringField({
          initial: "hp",
          choices: () => AH.resourceTypes,
          blank: true,
          label: "AH.FIELD.Resource",
          nullable: false,
        }),
        amount: new StringField({
          initial: "",
          nullable: false,
          label: "AH.FIELD.Amount",
        }),
      },
      {
        label: "AH.FIELD.Resource",
        _part: "properties",
      }),
    });
  }

  /**
   * @return {String}
   */
  static get localization() {
    return "AH.TACTICA.Consumable";
  }

  /**
   * @return {String}
   */
  static get template() {
    return systemTemplatePath("components/empty");
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
    if (this.cost.resource && this.cost.amount) {
      config.addExpense({
        resource: this.cost.resource,
        amount: this.cost.amount,
        perTarget: false,
        evaluated: false,
      });
    }
    if (this.resource.type && this.resource.amount) {
      config.setResource(this.resource.type, this.resource.amount);
    }
  }
}
