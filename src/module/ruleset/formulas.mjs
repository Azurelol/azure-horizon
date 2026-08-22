// CHARACTERS
import { getSystemSetting } from "../constants.mjs";
import AH from "../config.mjs";

const HP_MIGHT_FACTOR = 5;
const MP_WILLPOWER_FACTOR = 5;
const IP_BASE = 6;
const TP_BASE = 10;
const MIN_ATTRIBUTE_DIE = 4;
const PROFICIENCY_FACTOR = 5;
const FIXED_ATTRIBUTE_SCALING = 0.25;

/**
 * @typedef Modifier
 * @property {Number} additive Should default to 0.
 * @property {Number} multiplicative Should default to 1.
 * @property {Boolean} valid It's valid if it's not at default values.
 */

/**
 * A difficulty setting scales many parameters up and down.
 */
class Difficulty {
  /**
   * @abstract
   * @param {Number} level
   * @returns {Number}
   */
  calculateProficiencyBonus(level) {
    throw Error;
  }
  /**
   * @abstract
   * @returns {Number}
   */
  getFactor() {
    throw Error;
  }
}

/**
 * A classical difficulty with more manageable numbers.
 */
class ClassicDifficulty extends Difficulty {
  calculateProficiencyBonus(level) {
    return 0;
  }
  getFactor() {
    return 1;
  }
}

/**
 * The intended difficulty, for the digital experience.
 * @remarks Numbers go up.
 */
class HorizonDifficulty extends Difficulty {
  static HF = 5;
  calculateProficiencyBonus(level) {
    return 0;
    return Formulas.round(level / PROFICIENCY_FACTOR);
  }
  getFactor() {
    return HorizonDifficulty.HF;
  }
}

/**
 * @typedef {Modifier} ParameterModifier
 * @property {AH_Modifier} key
 */

export default class Formulas {

  static CRITICAL_THRESHOLD = MIN_ATTRIBUTE_DIE;

  /**
   * @returns {Difficulty}
   */
  static get difficulty() {
    if (!this.#difficulty) {
      const setting = getSystemSetting("difficulty");
      switch (setting) {
        case "horizon":
          this.#difficulty = new HorizonDifficulty();
          break;
        default:
          this.#difficulty = new ClassicDifficulty();
          break;
      }
    }
    return this.#difficulty;
  }
  static #difficulty;

  /**
   * @param {Number} level
   * @returns {Number}
   */
  static calculateProficiencyBonus(level) {
    const diff = this.difficulty;
    return diff.calculateProficiencyBonus(level);
  }

  /**
   * @typedef DamageCalculation
   * @property {Number} total
   * @property {String} formula
   */

  /**
   * @param {Number} amount
   * @param {ParameterModifier[]} modifiers
   */
  static calculateDamageInstance(amount, modifiers) {
    const { additive, multiplicative } = Formulas.joinModifiers(modifiers);
    return Formulas.round((amount + additive) * multiplicative);
  }

  /**
   * @param {ActionConfig} config
   * @param {AHActor} actor
   */
  static calculateAttributeInputs(config, actor) {

    if (config.isCheck) {
      return {
        primary: config.check.hr?.result,
        secondary: config.check.lr?.result,
      };
    }
    else {
      const attributes = actor.system.attributes;
      return {
        primary: attributes[config.check.primary] * FIXED_ATTRIBUTE_SCALING,
        secondary: attributes[config.check.secondary] * FIXED_ATTRIBUTE_SCALING,
      };
    }
  }

  /**
   * @param {DamageInstance[]} instances
   * @param {AH_Grade} grade
   * @return {DamageCalculation}
   */
  static calculateDamage(instances, grade) {
    const diff = this.difficulty;
    const diffFactor = diff.getFactor();

    let base = instances;
    let total;
    let formula;

    // Using the DIFFICULTY scaling system
    if (grade) {

      // Apply all modifiers first
      const _grade = AH.grades[grade];
      let base = 0;
      for (const inst of instances) {
        base += Formulas.calculateDamageInstance(inst.amount, inst.modifiers);
      }

      // For checks use the HR since its variable; else use the minimum of the given attribute die.
      const gradeFactor = _grade.scale;

      total = (base * gradeFactor) * diffFactor;
      formula = `(BASE:${base} * GRADE:${gradeFactor}) * DIFFICULTY:${diffFactor}`;
      total = Formulas.round(total);
    }
    // FLAT
    else {
      base = instances.reduce((sum, inst) => sum + inst.amount, 0);
      total = base * diffFactor;
      formula = `${base}`;
    }

    return {
      total,
      formula,
    };
  }

  /**
   * @param {EntityDataModel} system
   * @param {Number} level A level different from the serialized one.
   * @returns {Number}
   */
  static calculateHitPoints(system, level = undefined) {
    const actor = system.parent;
    level ??= system.level;
    let hp = 0;
    switch (actor.type) {

      case "hero": {
        /** @type AttributesDataModel **/
        const attributes = system.attributes;
        hp = level + (attributes.mig.base * HP_MIGHT_FACTOR);
        break;
      }

      case "adversary": {
        /** @type AttributesDataModel **/
        const attributes = system.attributes;
        /** @type AdversaryProfileDataModel **/
        const profile = system.profile;
        const rankMultiplier = profile.turns;
        hp = (level + (attributes.mig.base * HP_MIGHT_FACTOR)) * rankMultiplier;
        break;
      }

      case "follower":
      case "guest":
        hp = level;
        break;

      case "unit":
        break;
    }
    const factor = this.difficulty.getFactor();
    hp = hp * factor;
    return hp;
  }

  /**
   * @param {Number} level
   * @param {Number} willpower
   * @returns {Number}
   */
  static calculateMindPoints(level, willpower) {
    const hf = this.difficulty.getFactor();
    return (willpower * MP_WILLPOWER_FACTOR) + level;
  }

  /**
   * @returns {Number}
   */
  static calculateInventoryPoints() {
    return IP_BASE;
  }

  /**
   * @returns {Number}
   */
  static calculateTensionPoints() {
    return TP_BASE;
  }

  /**
   * @param {AttributesDataModel} attributes
   * @returns {Number}
   */
  static calculateDefense(attributes) {
    return this.round((attributes.dex.current + attributes.mig.current) / 2);
  }

  /**
   * @param {AttributesDataModel} attributes
   * @returns {Number}
   */
  static calculateMagicDefense(attributes) {
    return this.round((attributes.wlp.current + attributes.ins.current) / 2);
  }

  /**
   * @param {AttributesDataModel} attributes
   * @returns {Number}
   */
  static calculateInitiative(attributes) {
    return this.round((attributes.dex.current + attributes.ins.current) / 2);
  }

  /**
   * @param {ParameterModifier[]} modifiers
   * @return {Modifier}
   */
  static joinModifiers(modifiers) {
    let _additive = 0;
    let _multiplicative = 1;

    for (const { key, additive, multiplicative } of modifiers) {
      if (additive) {
        _additive += additive;
      }
      if (_multiplicative) {
        _multiplicative *= multiplicative;
      }
    }

    return { additive: _additive, multiplicative: _multiplicative, valid: (_additive !== 0) && (_multiplicative !== 1) };
  }

  /**
   * @param {Number} amount
   * @return {Number}
   */
  static round(amount) {
    return Math.round(amount);
  }

  /** @type {Record<string, {attacker: AH_Potency, defense: AH_Potency}>} */
  static #POTENCY_BY_OUTCOME = {
    critical: { attacker: "powerful", defense: "reduced" },
    fumble: { attacker: "reduced", defense: "powerful" },
    success: { attacker: "standard", defense: "reduced" },
    failure: { attacker: "reduced", defense: "standard" },
  };

  /**
   * @param {CheckResult} check
   * @param {Number} difficulty
   * @param {Boolean} defense
   * @return {AH_Potency}
   */
  static calculatePotency(check, difficulty, defense = false) {
    const outcome = check.critical
      ? "critical"
      : check.fumble
        ? "fumble"
        : check.total >= difficulty
          ? "success"
          : "failure";

    return this.#POTENCY_BY_OUTCOME[outcome][defense ? "defense" : "attacker"];
  }

}
