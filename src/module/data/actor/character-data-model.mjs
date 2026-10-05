import AH from "../../config.mjs";
import { ActorResourceDataModel, AffinitiesDataModel, AttributeDataModel } from "./system/_module.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import { VersionedDataModel } from "../api/_module.mjs";
import { BaseEntityDataModel } from "./entity-data-model.mjs";

const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;

/**
 * The set of attributes for a character.
 * @property {AttributeDataModel} mig
 * @property {AttributeDataModel} dex
 * @property {AttributeDataModel} ins
 * @property {AttributeDataModel} wlp
 */
export class CharacterAttributesDataModel extends VersionedDataModel {
  static defineSchema() {
    return {
      mig: new EmbeddedDataField(AttributeDataModel, {}),
      dex: new EmbeddedDataField(AttributeDataModel, {}),
      ins: new EmbeddedDataField(AttributeDataModel, {}),
      wlp: new EmbeddedDataField(AttributeDataModel, {}),
    };
  }
}

/**
 * @property {ActorResourceDataModel} hp
 */
export class CharacterResourcesDataModel extends VersionedDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      hp: new EmbeddedDataField(ActorResourceDataModel, {
        trackedAttribute: true,
      }),
    });
  }
}

/**
 * Base model for characters.
 * @abstract
 * @property {Number} level
 * @property {CharacterAttributesDataModel} attributes
 * @property {AffinitiesDataModel} affinities
 * @property {CharacterResourcesDataModel} resources
 * @property {CharacterParametersDataModel} parameters
 * @property {CharacterEquipmentDataModel} equipment
 */
export default class CharacterDataModel extends BaseEntityDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      attributes: new EmbeddedDataField(CharacterAttributesDataModel, {}),
      affinities: new EmbeddedDataField(AffinitiesDataModel, {}),
    });
  }

  /** @inheritdoc */
  prepareBaseData() {
  }

  /**
   * @override
   */
  prepareDerivedData() {
    super.prepareDerivedData();
    this._prepareParameters();
    this._prepareAffinities();
  }

  /**
   * @protected Prepares the character's parameters.
   */
  _prepareParameters() {
    const data = this;
    this.parameters.def.defineCurrentProperty(() => Formulas.calculateDefense(data));
    this.parameters.mdef.defineCurrentProperty(() => Formulas.calculateMagicDefense(data));
    this.parameters.init.defineCurrentProperty(() => Formulas.calculateInitiative(data));
    this.parameters.block.defineCurrentProperty(() => Formulas.calculateBlockParameter(data));
  }

  /**
   * @private Invoked before affinities are fully resolved.
   */
  _prepareAffinities() {
    // Add entries from affinities
    if (this.affinities) {
      for (const [key, aff] of Object.entries(this.affinities)) {
        if (aff.preset || aff.amount) {
          if (this.parameters.damage[key]) {
            const list = this.parameters.damage[key].incoming.skill;
            if (aff.preset) {
              list.multiplicative.push(AH.affinities[aff.preset].modifier);
            }
            else {
              switch (aff.type) {
                case "additive":
                  list.additive.push(aff.amount);
                  break;
                case "multiplicative":
                  list.multiplicative.push(aff.amount);
                  break;
              }
            }
          }
        }
      }
    }
  }

  /**
   * @returns {Number}
   */
  get proficiency() {
    return Formulas.calculateProficiencyBonus(this.level);
  }

  /**
   * @returns {boolean} Whether the character is in crisis (at 20% HP).
   */
  get crisis() {
    return Formulas.inCrisis(this.resources.hp);
  }

  /**
   * @returns {boolean} Whether the character is in peril (at 50% HP).
   * @remarks Also true if the character is in crisis.
   */
  get peril() {
    if (this.crisis) {
      return true;
    }
    return Formulas.inPeril(this.resources.hp);
  }

  /**
   * @returns {boolean} Whether the character is KO
   */
  get ko() {
    return this.resources.hp.value <= 0;
  }

  /**
   * @param {AHItem} item
   * @param {AH_InventorySlot|Number} slot
   */
  async equipItem(item, slot) {
    return this.equipment.toggleSlot(item, slot);
  }
}
