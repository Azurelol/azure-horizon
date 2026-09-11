import EquipmentDataModel from "./equipment-data-model.mjs";
import { isActorType, systemTemplatePath } from "../../constants.mjs";

const { SchemaField, NumberField, StringField, EmbeddedDataField, ArrayField, ForeignDocumentField } = foundry.data.fields;

/**
 * A reference to an engram item.
 * @property {String} name The name of the item.
 * @property {String} img The image of the item.
 * @property {String} item The reference to the item.

 */
export class EngramDataField extends SchemaField {
  constructor(options = {}) {
    super({
      // eslint-disable-next-line no-undef
      item: new ForeignDocumentField(Item, { nullable: true }),
    }, options);
  }
}

/**
 * Represents a hero's accessory, which can grant them small benefits.
 * @property {AH_Rarity} rarity
 * @property {EngramDataField[]} slots.entries
 * @property {Number} slots.max
 */
export default class AccessoryDataModel extends EquipmentDataModel {

  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      slots: new SchemaField({
        entries: new ArrayField(new EngramDataField(), {}),
        max: new NumberField({ initial: 1, min: 1, integer: true, nullable: false, label: "AH.ITEM.Engram.plural", _part: "header", classes: "ah-flex-shrink" }),
      }),
    });
  }

  static migrateData(source) {
    if (source.slots?.entries && source.slots?.max) {
      while (source.slots.entries.length < source.slots.max) {
        source.slots.entries.push({});
      }
    }
    return super.migrateData(source);
  }

  static get templates() {
    return {
      properties: systemTemplatePath("sheets/item/item-engram-slots"),
    };
  }

}
