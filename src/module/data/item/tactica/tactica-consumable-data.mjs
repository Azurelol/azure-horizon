import { systemTemplatePath } from "../../../constants.mjs";
import TacticaTypeDataModel from "../tactica-type-data-model.mjs";
import ResourceDataModel from "../fields/resource-data-model.mjs";
import AH from "../../../config.mjs";

/**
 * @property {Number} range.min
 * @property {Number} range.max
 * @property {ResourceDataModel} resource
 */
export default class TacticaConsumableData extends TacticaTypeDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "tacticaConsumableData" });
  }

  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, TypedSchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      range: new SchemaField({
        minimum: new NumberField({
          initial: 1,
          _part: "properties",
          _classes: "ah-flex-shrink",
          label: "AH.TACTICA.RANGE.Minimum",
        }),
        maximum: new NumberField({
          initial: 1,
          _part: "properties",
          _classes: "ah-flex-shrink",
          label: "AH.TACTICA.RANGE.Maximum",
        }),
      }),
      resource: new SchemaField({
        type: new StringField({
          initial: "hp",
          choices: () => AH.resourceTypes,
          blank: true,
          label: "AH.FIELD.Type",
          nullable: false,
          _part: "properties",
        }),
        amount: new StringField({
          initial: "",
          nullable: false,
          label: "AH.FIELD.Amount",
          _part: "properties",
        }),
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
}
