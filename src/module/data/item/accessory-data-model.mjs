import EquipmentDataModel from "./equipment-data-model.mjs";
import { isActorType, systemTemplatePath } from "../../constants.mjs";
import { ObjectUtils } from "../../utils/_module.mjs";
import { PotentialsDataModel } from "./fields/potentials-data-model.mjs";
import { ChatMessageSections } from "../../helpers/_module.mjs";

const { SchemaField, NumberField, StringField, EmbeddedDataField, DocumentIdField, ArrayField, ForeignDocumentField } = foundry.data.fields;

/**
 * A reference to an engram item.
 * @property {String} item The id of the item.
 */
export class EngramDataField extends SchemaField {
  constructor(options = {}) {
    super({
      // eslint-disable-next-line no-undef
      item: new DocumentIdField(Item, { nullable: true, readonly: false }),
    }, options);
  }

  /** @override */
  _toInput(config) {
    const container = document.createElement("div");
    const textField = this.fields.item;
    const textInput = textField.toInput({
      ...config,
      name: `${config.name}.text`,
      value: config.value?.text ?? "",
    });
    container.append(textInput);
    return container;
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
        entries: new ArrayField(new EngramDataField(), {
          config: false,
        }),
        max: new NumberField({ initial: 1, min: 1, integer: true,
          nullable: false, label: "AH.ITEM.Engram.plural",
          _part: "header", _classes: "ah-flex-shrink" }),
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

  /** @inheritdoc */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    /** @type AH_Rarity **/
    const newRarity = ObjectUtils.getProperty(changes, "system.rarity");
    if (newRarity) {
      let maxSlots;
      switch (newRarity) {
        case "common":
          maxSlots = 1;
          break;
        case "uncommon":
          maxSlots = 2;
          break;
        case "rare":
          maxSlots = 3;
          break;
        case "epic":
          maxSlots = 4;
          break;
      }
      ObjectUtils.setProperty(changes, "system.slots.max", maxSlots);

    }

    const newMax = ObjectUtils.getProperty(changes, "system.slots.max");
    if (newMax !== undefined) {
      const incomingEntries = ObjectUtils.getProperty(changes, "system.slots.entries");
      const baseEntries = incomingEntries ?? this.slots.entries;
      const entries = ObjectUtils.safeClone(
        baseEntries.map(e => (e.toObject ? e.toObject() : e)),
      );

      if (entries.length < newMax) {
        while (entries.length < newMax) {
          entries.push({});
        }
      } else if (entries.length > newMax) {
        entries.length = newMax;
      }

      ObjectUtils.setProperty(changes, "system.slots.entries", entries);
    }

    return true;
  }
}
