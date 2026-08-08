import AH from "../../config.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";
import VersionedDataModel from "./versioned-data-model.mjs";
import { Formulas } from "../../ruleset/_module.mjs";

const { SchemaField, NumberField, StringField, EmbeddedDataField, ArrayField } = foundry.data.fields;

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
   * @returns {ParameterModifier[]}
   */
  resolveModifiers() {
    /** @type ParameterModifier[] **/
    let modifiers = [];

    for (const key of Object.keys(AH.modifiers)) {
      const modifier = this[key];
      if (!modifier) continue;

      if (!modifier.additive.length && !modifier.multiplicative.length) {
        continue;
      }

      let _additive = 0;
      let _multiplicative = 1;

      if (modifier.additive.length) {
        _additive += Math.max(0, ...modifier.additive) + Math.min(0, ...modifier.additive);
      }
      if (modifier.multiplicative.length) {
        _multiplicative *= modifier.multiplicative.reduce((best, m) =>
          Math.abs(m - 1) > Math.abs(best - 1) ? m : best, 1);
      }

      modifiers.push({
        key,
        additive: _additive,
        multiplicative: _multiplicative,
      });
    }

    return modifiers;
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

/**
 * @typedef ModifierEntry
 * @property {String} key
 * @property {Number} additive
 * @property {Number} multiplicative
 */

/**
 * Resolves all modifiers and returns them.
 * @property {DataModel} model
 * @returns {ModifierEntry[]}
 */
function resolveFromModel(model) {
  /** @param {ModifiersDataModel} model **/
  const collectModifiers = (model) => {
    return Formulas.joinModifiers(model.resolveModifiers());
  };

  /** @param {ExchangeModifiersDataModel} model **/
  const collectExchange = (model) => {
    return {
      outgoing: Formulas.joinModifiers(model.outgoing.resolveModifiers()),
      incoming: Formulas.joinModifiers(model.incoming.resolveModifiers()),
    };
  };

  const results = [];

  const walk = (node, path) => {
    if (!node || (typeof node !== "object")) return;

    if (node instanceof ExchangeModifiersDataModel) {
      const { outgoing, incoming } = collectExchange(node);
      results.push({ key: `${path}.outgoing`, ...outgoing });
      results.push({ key: `${path}.incoming`, ...incoming });
      return;
    }

    if (node instanceof ModifiersDataModel) {
      results.push({ key: path, ...collectModifiers(node) });
      return;
    }

    if (node instanceof foundry.abstract.DataModel) {
      const fields = node.schema?.fields ?? {};
      for (const fieldName of Object.keys(fields)) {
        walk(node[fieldName], path ? `${path}.${fieldName}` : fieldName);
      }
    }
  };

  const rootFields = model.schema?.fields ?? {};
  for (const fieldName of Object.keys(rootFields)) {
    walk(model[fieldName], fieldName);
  }

  return results;
}

export const Modifiers = Object.freeze({
  resolveFromModel,
});
