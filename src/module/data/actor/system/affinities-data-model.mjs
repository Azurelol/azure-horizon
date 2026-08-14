import { VersionedDataModel } from "../../api/_module.mjs";
import AffinityField from "./affinity-field.mjs";
import AH from "../../../config.mjs";

/**
 * @property {AffinityField} physical
 * @property {AffinityField} slashing
 * @property {AffinityField} piercing
 * @property {AffinityField} bludgeoning
 * @property {AffinityField} elemental
 * @property {AffinityField} fire
 * @property {AffinityField} cold
 * @property {AffinityField} electric
 * @remarks This is a set is later added into {@linkcode CharacterParametersDataModel}
 */
export default class AffinitiesDataModel extends VersionedDataModel {
  static defineSchema() {
    const { EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      physical: new AffinityField(),
      slashing: new AffinityField(),
      piercing: new AffinityField(),
      bludgeoning: new AffinityField(),

      elemental: new AffinityField(),
      fire: new AffinityField(),
      cold: new AffinityField(),
      electric: new AffinityField(),
    });
  }

  /**
   * @return {AffinityField[]}
   */
  get entries() {
    return [this.physical, this.slashing, this.piercing, this.bludgeoning,
      this.elemental, this.fire, this.cold, this.electric];
  }

  /**
   * @return {ParameterModifier[]}
   */
  get modifiers() {
    let result = [];
    for (const aff of this.entries) {
      if (aff.preset || aff.amount) {
        result.push(this.toModifier(aff));
      }
    }
    return result;
  }

  /**
   * @param {AffinityField} field
   * @returns {ParameterModifier}
   */
  toModifier(field) {
    if (field.preset) {
      const preset = AH.affinities[field.preset];
      return {
        key: "skill",
        additive: 0,
        multiplicative: preset.modifier,
      };
    }
    else {
      return {
        key: "skill",
        additive: 0,
        multiplicative: 1,
        [field.type]: field.amount,
      };
    }
  }
}
