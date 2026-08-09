import CharacterDataModel, {
  CharacterResourcesDataModel,
} from "./character-data-model.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import EquipmentDataModel from "./system/equipment-data-model.mjs";
import { ResourceDataModel } from "./system/_module.mjs";
import { CharacterParametersDataModel } from "./character-parameters-data-model.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

/**
 * @typedef CharacterResources
 * @property {ResourceDataModel} hp
 * @property {ResourceDataModel} mp
 * @property {ResourceDataModel} ip
 */

/**
 * @typedef CharacterAttributes
 */

/**
 * @property {ParameterDataModel} def
 * @property {ParameterDataModel} mdef
 */
class HeroParametersDataModel extends CharacterParametersDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
    });
  }
}

/**
 * @property {ResourceDataModel} hp
 * @property {ResourceDataModel} mp
 * @property {ResourceDataModel} ip
 * @property {ResourceDataModel} tp
 */
class HeroResourcesDataModel extends CharacterResourcesDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      ip: new EmbeddedDataField(ResourceDataModel, {}),
      tp: new EmbeddedDataField(ResourceDataModel, {}),
    });
  }
}

/**
 * Represents the data of PC in combat.
 * @property {HeroResourcesDataModel} resources
 * @property {HeroParametersDataModel} parameters
 * @property {EquipmentDataModel} equipment
 */
export default class HeroDataModel extends CharacterDataModel {

  /**
   * @type {Set<AH_ItemType>}
   */
  static ITEM_TYPES = new Set(["class", "skill", "armor", "weapon", "accessory", "consumable", "spell"]);

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      equipment: new EmbeddedDataField(EquipmentDataModel, {}),
      parameters: new EmbeddedDataField(HeroParametersDataModel, {}),
      resources: new EmbeddedDataField(HeroResourcesDataModel, {}),
    });
  }

  _prepareResources() {
    super._prepareResources();
    this.resources.ip.defineMaximumProperty(() => Formulas.calculateInventoryPoints());
    this.resources.tp.defineMaximumProperty(() => Formulas.calculateTensionPoints());
  }

  _prepareParameters() {
    super._prepareParameters();
  }

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;

    const updates = foundry.utils.mergeObject({
      prototypeToken: {
        actorLink: true,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        sight: {
          enabled: true,
        },
      },
    }, data, { insertKeys: false, insertValues: false, inplace: false });

    this.parent.updateSource(updates);
  }

  /*--------------------------------------------------------------*/

  supportsItemType(type) {
    return HeroDataModel.ITEM_TYPES.has(type);
  }

  /**
   * @typedef EquippedItems
   * @property {AHItem} mainHand
   * @property {AHItem} offHand
   * @property {AHItem} armor
   */

  /**
   * @returns {EquippedItems}
   */
  getEquippedItems() {
    const actor = this.parent;
    return {
      mainHand: actor.items.get(this.equipment.mainHand),
      offHand: actor.items.get(this.equipment.offHand),
      armor: actor.items.get(this.equipment.armor),
    };
  }

  /**
   * @param {AH_Defense} targeted
   * @return {DefenseCheckConfig}
   */
  getDefense(targeted) {
    let primary, secondary;
    /** @type ArmorDataModel **/
    let armorData;

    switch (targeted) {
      case "def": {
        const equipped = this.getEquippedItems();
        if (equipped.armor) {
          armorData = equipped.armor.system;
          switch (armorData.category) {
            case "light":
              primary = "dex";
              secondary = "ins";
              break;
            case "heavy":
              primary = "mig";
              secondary = "wlp";
              break;
          }
        }
        // Unarmored
        else {
          primary = "dex";
          secondary = "ins";
        }
      }
        break;

      case "mdef":
        primary = "ins";
        secondary = "wlp";
        break;

      case "dex":
      case "ins":
      case "wlp":
      case "mig":
        primary = secondary = targeted;
        break;
    }

    return {
      primary,
      secondary,
      armorData,
    };
  }

  /*--------------------------------------------------------------*/

}
