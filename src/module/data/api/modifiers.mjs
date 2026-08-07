import AH from "../../config.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import VersionedDataModel from "./versioned-data-model.mjs";

const { SchemaField, NumberField, StringField, EmbeddedDataField, ArrayField } = foundry.data.fields;

/**
 * @typedef ResolvedModifiers
 * @property {Number} additive
 * @property {Number} multiplicative
 */

/**
 * Used for character-level modifiers such as damage dealt, healing received, etc.
 */
export class ModifierDataField extends SchemaField {
  constructor(options = {}) {
    super({
      additive: new ArrayField(new NumberField()),
      multiplicative: new ArrayField(new NumberField()),
    }, options);
  }
}

/**
 * Used for character-level modifiers such as damage dealt, healing received, etc.
 * @property {ModifierDataField} status
 * @property {ModifierDataField} equipment
 */
export class ModifiersDataModel extends VersionedDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      status: new ModifierDataField(),
      equipment: new ModifierDataField(),
    });
  }

  /**
   * @param {ModifiersDataModel} model
   * @returns {{flat: number, multiplier: number}}
   */
  static resolveModifiers(model) {
    let flat = 0;
    let multiplier = 1;

    for (const type of Object.keys(model)) {
      const { additive, multiplicative } = model[type];
      if (additive.length) flat += Math.max(0, ...additive) + Math.min(0, ...additive);
      if (multiplicative.length) {
        multiplier *= multiplicative.reduce((best, m) =>
          Math.abs(m - 1) > Math.abs(best - 1) ? m : best, 1);
      }
    }

    return { flat, multiplier };
  }
}

/**
 * Stores the modifiers for a directional exchange such as damage dealt/taken, healing given/received, etc.
 * @property {ModifiersDataModel} incoming
 * @property {ModifiersDataModel} outgoing
 */
export class ExchangeModifiersDataModel extends foundry.abstract.DataModel {
  static defineSchema() {
    return {
      incoming: new EmbeddedDataField(ModifiersDataModel),
      outgoing: new EmbeddedDataField(ModifiersDataModel),
    };
  }
}
