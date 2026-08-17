import CharacterDataModel, {
  CharacterResourcesDataModel,
} from "./character-data-model.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import InventoryDataModel from "./system/inventory-data-model.mjs";
import { CharacterParametersDataModel } from "./character-parameters-data-model.mjs";
import { ActorResourceDataModel } from "./system/_module.mjs";
import HeroProfileDataModel from "./system/hero-profile-data-model.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

/**
 * @typedef CharacterResources
 * @property {ActorResourceDataModel} hp
 * @property {ActorResourceDataModel} mp
 * @property {ActorResourceDataModel} ip
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
 * @property {ActorResourceDataModel} hp
 * @property {ActorResourceDataModel} mp
 * @property {ActorResourceDataModel} ip
 * @property {ActorResourceDataModel} tp
 */
class HeroResourcesDataModel extends CharacterResourcesDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      ip: new EmbeddedDataField(ActorResourceDataModel, {}),
      tp: new EmbeddedDataField(ActorResourceDataModel, {}),
    });
  }
}

/**
 * Represents the data of PC in combat.
 * @property {HeroResourcesDataModel} resources
 * @property {HeroParametersDataModel} parameters
 * @property {InventoryDataModel} equipment
 * @property {HeroProfileDataModel} profile
 */
export default class HeroDataModel extends CharacterDataModel {

  /**
   * @type {Set<AH_ItemType>}
   */
  static ITEM_TYPES = new Set(["class", "skill", "armor", "weapon", "accessory", "consumable", "spell"]);

  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      equipment: new EmbeddedDataField(InventoryDataModel, {}),
      parameters: new EmbeddedDataField(HeroParametersDataModel, {}),
      resources: new EmbeddedDataField(HeroResourcesDataModel, {}),
      profile: new EmbeddedDataField(HeroProfileDataModel, {}),
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
   * @param {AHItem} item
   * @param {AH_InventorySlot }slot
   */
  async equipItem(item, slot) {
    const type = item.type;
    const actor = this.parent;
    switch (type) {
      case "weapon": {
        const data = actor.system.equipment.toggleWeapon(item, slot);
        if (data) {
          await actor.update({ "system.equipment": data });
        }
        break;
      }
      case "armor": {
        const data = actor.system.equipment.toggleArmor(item);
        if (data) {
          await actor.update({ "system.equipment": data });
        }
        break;
      }
    }
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
