import AH from "../../config.mjs";
import {
  AffinitiesDataModel,
  AttributesDataModel, ParameterDataModel,
  ResourceDataModel,
} from "./system/_module.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import ActorDataModel from "./actor-data-model.mjs";
import { VersionedDataModel } from "../api/_module.mjs";

/**
 * @property {ResourceDataModel} hp
 * @property {ResourceDataModel} mp
 */
export class CharacterResourcesDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      hp: new EmbeddedDataField(ResourceDataModel, {}),
      mp: new EmbeddedDataField(ResourceDataModel, {}),
    });
  }
}

/**
 * @property {ParameterDataModel} def
 * @property {ParameterDataModel} mdef
 */
export class CharacterParametersDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField, SchemaField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      def: new EmbeddedDataField(ParameterDataModel, {}),
      mdef: new EmbeddedDataField(ParameterDataModel, {}),
    });
  }
}

/**
 * Base model for characters.
 * @property {Number} level
 * @property {AttributesDataModel} attributes
 * @property {AffinitiesDataModel} affinities
 * @property {CharacterResourcesDataModel} resources
 * @property {CharacterParametersDataModel} parameters
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

  /** @inheritdoc */
  prepareBaseData() {
  }

  /**
   * @override
   */
  prepareDerivedData() {
    this._prepareResources();
    this._prepareParameters();
  }

  /**
   * @protected Prepares the character's resources such as HP.
   */
  _prepareResources() {
    const data = this;
    this.resources.hp.defineMaximumProperty(() => Formulas.calculateHitPoints(data.level, data.attributes.mig.base));
    this.resources.mp.defineMaximumProperty(() => Formulas.calculateMindPoints(data.level, data.attributes.wlp.base));
  }
  /**
   * @protected Prepares the character's parameters.
   */
  _prepareParameters() {
    const data = this;
    this.parameters.def.defineCurrentProperty(() => Formulas.calculateDefense(data.attributes));
    this.parameters.mdef.defineCurrentProperty(() => Formulas.calculateMagicDefense(data.attributes));
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
