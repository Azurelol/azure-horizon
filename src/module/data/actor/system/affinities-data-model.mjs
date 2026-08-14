import { VersionedDataModel } from "../../api/_module.mjs";
import AffinityField from "./affinity-field.mjs";
import AH from "../../../config.mjs";

/**
 * @property {AffinityField} physical
 * @property {AffinityField} slashing
 * @property {AffinityField} piercing
 * @property {AffinityField} bludgeoning
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
    });
  }

  /**
   * @return {AffinityField[]}
   */
  get entries() {
    return [this.physical, this.slashing, this.piercing, this.bludgeoning];
  }

  /**
   * @param {AffinityField} field
   * @returns {Modifier}
   */
  toModifier(field) {
    if (field.preset) {
      const preset = AH.affinities[field.preset];
      return {
        additive: 0,
        multiplicative: preset.modifier,
      };
    }
    else {
      return {
        additive: 0,
        multiplicative: 1,
        [field.type]: field.amount,
      };
    }
  }
}
