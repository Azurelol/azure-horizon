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
   * @returns {ResolvedModifiers}
   */
  resolveModifiers() {
    let _additive = 0;
    let _multiplicative = 1;

    for (const type of [this.status, this.equipment]) {
      const { additive, multiplicative } = type;
      if (additive.length) _additive += Math.max(0, ...additive) + Math.min(0, ...additive);
      if (multiplicative.length) {
        _multiplicative *= multiplicative.reduce((best, m) =>
          Math.abs(m - 1) > Math.abs(best - 1) ? m : best, 1);
      }
    }

    return { additive: _additive, multiplicative: _multiplicative };
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
    return model.resolveModifiers();
  };

  /** @param {ExchangeModifiersDataModel} model **/
  const collectExchange = (model) => {
    return {
      outgoing: model.outgoing.resolveModifiers(),
      incoming: model.incoming.resolveModifiers(),
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
