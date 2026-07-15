import { ActorDataModel } from "./_module.mjs";
import AH from "../../config.mjs";
import { AttributesDataModel } from "./system/_module.mjs";

/**
 * Base model for characters.
 * @property {Number} level
 */
export default class BaseCharacterDataModel extends ActorDataModel {
  static defineSchema() {
    const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      attributes: new EmbeddedDataField(AttributesDataModel, {}),
      level: new NumberField({
        initial: AH.progression.level.minimum,
        min: AH.progression.level.minimum,
        max: AH.progression.level.maximum,
        integer: true,
        nullable: false,
      }),
    });
  }
}
