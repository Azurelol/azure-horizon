import AH from "../../config.mjs";
import { AffinitiesDataModel, AttributesDataModel, HeroParametersDataModel } from "./system/_module.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import ActorDataModel from "./actor-data-model.mjs";

/**
 * Base model for characters.
 * @property {Number} level
 * @property {AttributesDataModel} attributes
 * @property {AffinitiesDataModel} affinities
 * @property {HeroParametersDataModel} parameters
 */
export default class BaseCharacterDataModel extends ActorDataModel {
  static defineSchema() {
    const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      attributes: new EmbeddedDataField(AttributesDataModel, {}),
      affinities: new EmbeddedDataField(AffinitiesDataModel, {}),
      level: new NumberField({
        initial: AH.progression.level.minimum,
        min: AH.progression.level.minimum,
        max: AH.progression.level.maximum,
        integer: true,
        nullable: false,
      }),
    });
  }

  /**
   * @override
   */
  prepareDerivedData() {
    this._prepareParameters();
  }

  /**
   * @protected Prepares the character's parameters.
   */
  _prepareParameters() {
    const data = this;
    this.parameters.hp.defineMaximumProperty(() => Formulas.calculateHitPoints(data.level, data.attributes.mig.base));
    this.parameters.mp.defineMaximumProperty(() => Formulas.calculateMindPoints(data.level, data.attributes.wlp.base));
    this.parameters.def.defineCurrentProperty(() => Formulas.calculateDefense(data.attributes));
    this.parameters.mdef.defineCurrentProperty(() => Formulas.calculateMagicDefense(data.attributes));
  }

  /**
   * @returns {boolean} Whether the character is in crisis
   */
  get crisis() {
    return this.parameters.hp.half <= this.parameters.hp.max;
  }

  /**
   * @returns {boolean} Whether the character is KO
   */
  get ko() {
    return this.parameters.hp.value <= 0;
  }
}
