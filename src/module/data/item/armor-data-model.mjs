import ItemDataModel from "./item-data-model.mjs";
import { CheckDataModel, TraitsField } from "./fields/_module.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import EquipmentDataModel from "./equipment-data-model.mjs";
import { PotentialsDataModel } from "./fields/potentials-data-model.mjs";
import { ChatMessageSections } from "../../helpers/chat-message-sections.mjs";

/**
 * Represents a hero's armor, which alters how they defend themselves.
 * @property {AH_Rarity} rarity
 * @property {AH_EquipmentWeight} weight
 * @property {PotentialsDataModel} potentials
 * @property {Set<String>} traits
 */
export default class ArmorDataModel extends EquipmentDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      potentials: new EmbeddedDataField(PotentialsDataModel),
      weight: new StringField({
        initial: "light",
        blank: false,
        _part: "header",
        label: "AH.FIELD.Weight",
        choices: () => AH.equipmentWeight,
      }),
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        _part: "header",
        formOptions: getFormSelectOptions(AH.traits.armor),
      }),
    });
  }

  /**
   * @param {ChatMessageBuilder} builder
   * @returns {Promise<void>}
   */
  async prepareChatMessage(builder) {
    ChatMessageSections.potentials(builder.sections, this.potentials.entries);
  }
}
