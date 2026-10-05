import { systemTemplatePath } from "../../../constants.mjs";
import TacticaTypeDataModel from "../tactica-type-data-model.mjs";

export default class TacticaEmptyData extends TacticaTypeDataModel {
  static {
    Object.defineProperty(this, "TYPE", { value: "tacticaEmpty" });
  }

  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, TypedSchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
    });
  }

  /**
   * @return {String}
   */
  static get localization() {
    return "-";
  }

  /**
   * @return {String}
   */
  static get template() {
    return systemTemplatePath("components/empty");
  }
}
