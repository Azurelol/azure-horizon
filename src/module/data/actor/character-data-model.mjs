import AH from "../../config.mjs";
import { ActorResourceDataModel, AffinitiesDataModel, AttributesDataModel } from "./system/_module.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import ActorDataModel from "./actor-data-model.mjs";
import { VersionedDataModel } from "../api/_module.mjs";
import EntityDataModel from "./entity-data-model.mjs";

/**
 * @property {ActorResourceDataModel} hp
 * @property {ActorResourceDataModel} mp
 */
export class CharacterResourcesDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      hp: new EmbeddedDataField(ActorResourceDataModel, {
        trackedAttribute: true,
      }),
      mp: new EmbeddedDataField(ActorResourceDataModel, {}),
    });
  }
}

/**
 * Base model for characters.
 * @abstract
 * @property {Number} level
 * @property {AttributesDataModel} attributes
 * @property {AffinitiesDataModel} affinities
 * @property {CharacterResourcesDataModel} resources
 * @property {CharacterParametersDataModel} parameters
 */
export default class CharacterDataModel extends EntityDataModel {
  static defineSchema() {
    const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      attributes: new EmbeddedDataField(AttributesDataModel, {}),
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
  }

  /**
   * @protected Prepares the character's resources such as HP.
   */
  _prepareResources() {
    super._prepareResources();
    const data = this;
    this.resources.mp.defineMaximumProperty(() => Formulas.calculateMindPoints(this));
  }

  /**
   * @protected Prepares the character's parameters.
   */
  _prepareParameters() {
    const data = this;
    this.parameters.def.defineCurrentProperty(() => Formulas.calculateDefense(data.attributes));
    this.parameters.mdef.defineCurrentProperty(() => Formulas.calculateMagicDefense(data.attributes));
    this.parameters.init.defineCurrentProperty(() => Formulas.calculateInitiative(data.attributes));
    this.parameters.block.defineCurrentProperty(() => Formulas.calculateBlockParameter(data));

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
   * @returns {boolean} Whether the character is in crisis
   */
  get crisis() {
    return this.resources.hp.half <= this.resources.hp.max;
  }

  /**
   * @returns {boolean} Whether the character is KO
   */
  get ko() {
    return this.resources.hp.value <= 0;
  }
}
