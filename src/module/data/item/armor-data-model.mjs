import ItemDataModel from "./item-data-model.mjs";
import { CheckDataModel, TraitsField } from "./fields/_module.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import { FoundryUtils, ObjectUtils } from "../../utils/_module.mjs";
import EquipmentDataModel from "./equipment-data-model.mjs";
import { PotentialsDataModel } from "./fields/potentials-data-model.mjs";
import { ChatMessageSections } from "../../helpers/chat-message-sections.mjs";

/**
 * Represents a hero's armor, which alters how they defend themselves.
 * @property {AH_Rarity} rarity
 * @property {AH_EquipmentWeight} weight
 * @property {PotentialsDataModel} potentials
 * @property {Number} def
 * @property {Number} mdef
 * @property {Number} init
 * @property {AH_DamageType[]} advantage
 * @property {AH_DamageType[]} disadvantage
 */
export default class ArmorDataModel extends EquipmentDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, NumberField, StringField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      potentials: new EmbeddedDataField(PotentialsDataModel),
      weight: new StringField({
        initial: "light",
        blank: false,
        _part: "header",
        label: "AH.FIELD.Weight",
        choices: () => AH.equipment.weight,
      }),

      def: new NumberField({ initial: 0, _part: "header",
        _classes: "ah-flex-shrink",
        label: "AH.CHARACTER.Defense.short" }),
      mdef: new NumberField({ initial: 0, _part: "header",
        _classes: "ah-flex-shrink",
        label: "AH.CHARACTER.MagicDefense.short" }),
      init: new NumberField({ initial: 0, _part: "header",
        _classes: "ah-flex-shrink",
        label: "AH.CHARACTER.Initiative.short" }),

      advantage: new TraitsField({
        _part: "header",
        label: "AH.CHARACTER.Advantage.short",
        formOptions: getFormSelectOptions(AH.damageTypes),
      }),
      disadvantage: new TraitsField({
        _part: "header",
        label: "AH.CHARACTER.Disadvantage.short",
        formOptions: getFormSelectOptions(AH.damageTypes),
      }),

    });
  }

  /** @inheritdoc */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;

    /** @type AH_Rarity **/
    const newRarity = ObjectUtils.getProperty(changes, "system.rarity");
    if (newRarity !== this.rarity) {
      switch (newRarity) {
        case "common":
          break;
        case "uncommon":
          break;
        case "rare":
          break;
        case "epic":
          break;

      }
    }

    return true;
  }

  *allApplicableTraits() {
    yield* super.allApplicableTraits();
    yield this.weight;
  }

  /**
   * @param {ChatMessageBuilder} builder
   * @returns {Promise<void>}
   */
  async prepareChatMessage(builder) {
    ChatMessageSections.potentials(builder.sections, this.potentials.entries);
  }
}
