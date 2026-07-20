import { ActorDataModel } from "./_module.mjs";
import AH from "../../config.mjs";
import { AffinitiesDataModel, AttributesDataModel, ParametersDataModel } from "./system/_module.mjs";

/**
 * Base model for characters.
 * @property {Number} level
 * @property {AttributesDataModel} attributes
 * @property {AffinitiesDataModel} affinities
 * @property {ParametersDataModel} parameters
 */
export default class BaseCharacterDataModel extends ActorDataModel {
  static defineSchema() {
    const { SchemaField, NumberField, StringField, ArrayField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      attributes: new EmbeddedDataField(AttributesDataModel, {}),
      affinities: new EmbeddedDataField(AffinitiesDataModel, {}),
      parameters: new EmbeddedDataField(ParametersDataModel, {}),
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
  prepareBaseData() {
  }

  /**
   * @override
   */
  prepareDerivedData() {
    this.#prepareParameters();
  }

  #prepareParameters() {
    const data = this;
    ParametersDataModel.defineMaximumProperty(this.parameters.hp, () => ParametersDataModel.calculateHitPoints(data.level, data.attributes.mig.base));
    ParametersDataModel.defineMaximumProperty(this.parameters.mp, () => ParametersDataModel.calculateMindPoints(data.level, data.attributes.wlp.base));

    // Object.defineProperty(this.parameters.hp, "max", {
    //   configurable: true,
    //   enumerable: true,
    //   get() {
    //     return ParametersDataModel.calculateHitPoints(data.level, data.attributes.mig.base) + this.bonus;
    //   },
    //   set(newValue) {
    //     delete this.max;
    //     this.max = newValue;
    //   },
    // });

  }
}
