// CHARACTERS
import AH, { scaleValue } from "../config.mjs";

const MIN_ATTRIBUTE_DIE = 4;
const MAX_ATTRIBUTE_DIE = 20; // L90

const HP_MIGHT_FACTOR = 5;
const MP_WILLPOWER_FACTOR = 5;
const HP_POTENTIAL_FACTOR = 10;

const IP_BASE = 6;
const TP_BASE = 4;

const CLASS_BENEFIT_HP = 10;
const CLASS_BENEFIT_MP = 10;

const RECOVERY_HP_GAINED = 0.3;
const RECOVERY_MP_SPENT = 0.2;
const RECOVERY_TP_ADDED = 1;

const BLOCK_RATIO_BASE = 0.05;
const BLOCK_RATIO_LIGHT_ARMOR = 0.5;
const BLOCK_RATIO_HEAVY_ARMOR = 0.1;
const BLOCK_TP_GAINED = 1;

/**
 * @typedef Modifier
 * @property {Number} additive Should default to 0.
 * @property {Number} multiplicative Should default to 1.
 * @property {Boolean} valid It's valid if it's not at default values.
 */

/**
 * @typedef {Modifier} ParameterModifier
 * @property {AH_Modifier} key
 */

/**
 * @param {AHActor} actor
 * @param {(ClassBenefitsDataModel) => void} onBenefits
 */
function forClassBenefits(actor, onBenefits) {
  const classItems = actor.getItemsByType("class");
  for (const ci of classItems) {
    const benefits = ci.system.benefits;
    onBenefits(benefits);
  }
}

export default class Formulas {

  // TODO: Use for checks???
  /**
   * @param {Number} level
   * @returns {Number}
   */
  static calculateProficiencyBonus(level) {
    return level / 5;
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
    if (!actor.isCharacterType) {
      return {
        primary: undefined,
        secondary: undefined,
      };
    }
    if (config.isCheck) {
      const grade = AH.grades[config.grade].scale;
      return {
        primary: config.check.hr?.result * grade,
        secondary: config.check.lr?.result * grade,
      };
    }
    else {
      const scale = AH.grades.E.scale;
      const attributes = actor.system.attributes;
      const primary = config.check.primary ? attributes[config.check.primary].current * scale : undefined;
      const secondary = config.check.secondary ? attributes[config.check.secondary].current * scale : undefined;
      return {
        primary: primary,
        secondary: secondary,
      };
    }
  }

  /**
   * @param {DamageInstance[]} instances
   * @param {Boolean} fixed
   * @return {DamageCalculation}
   */
  static calculateDamage(instances, fixed) {
    let base = instances;
    let total;
    let formula;

    if (fixed) {
      base = instances.reduce((sum, inst) => sum + inst.amount, 0);
      total = base;
      formula = `${base}`;
    }
    else {
      let base = 0;
      for (const inst of instances) {
        inst.amount = Formulas.calculateDamageInstance(inst.base, inst.modifiers);
        base += inst.amount;
      }
      total = base;
      formula = `${base}`;
      total = Formulas.round(total);
    }

    return {
      total,
      formula,
    };
  }

  /**
   * @param {EntityDataModel|HeroDataModel|AdversaryDataModel|FollowerDataModel} system
   * @param {Number} level A level different from the serialized one.
   * @returns {Number}
   */
  static calculateHitPoints(system, level = undefined) {
    /** @type AHActor **/
    const actor = system.parent;
    level ??= system.level;
    let hp = 0;
    switch (actor.type) {

      case "hero": {
        /** @type AttributesDataModel **/
        const attributes = system.attributes;
        hp += level + (attributes.mig.base * HP_MIGHT_FACTOR);
        forClassBenefits(actor, (benefits) => {
          if (benefits.hp) {
            hp += CLASS_BENEFIT_HP;
          }
        });
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

      case "follower": {
        hp = level;
        const potential = system.potential;
        hp += (HP_POTENTIAL_FACTOR * potential);
      }
        break;

      case "entity": {
        hp = level;
      }
        break;

      case "unit":
        hp = level;
        break;
    }
    hp = scaleValue(hp);
    return hp;
  }

  /**
   * @param {CharacterDataModel|HeroDataModel|AdversaryDataModel} system
   * @returns {Number}
   */
  static calculateMindPoints(system) {
    const wlp = system.attributes.wlp.current;
    let mp = (wlp * MP_WILLPOWER_FACTOR) + system.level;
    if (system.parent.type === "hero") {
      forClassBenefits(system.parent, benefits => {
        if (benefits.mp) {
          mp += CLASS_BENEFIT_HP;
        }
      });
    }
    return mp;
  }

  /**
   * @param {HeroDataModel} system
   * @returns {Number}
   */
  static calculateInventoryPoints(system) {
    let ip = IP_BASE;
    forClassBenefits(system.parent, (benefits) => {
      if (benefits.ip) {
        ip += CLASS_BENEFIT_HP;
      }
    });
    return ip;
  }

  /**
   * @param {HeroDataModel} system
   * @returns {Number}
   */
  static calculateTensionPoints(system) {
    return TP_BASE + system.attributes.wlp.current;
  }

  /**
   * @param {AdversaryDataModel} system
   * @returns {Number}
   */
  static calculatePressurePoints(system) {
    return system.profile.rank === "champion"
      ? 2 + system.profile.turns * 2 : 4;
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
   * @param {HeroDataModel|AdversaryDataModel} system
   * @returns {Number}
   */
  static calculateBlockParameter(system) {
    // For now let's do it over there
    return 0;
  }

  /**
   * @typedef AH_RecoveryData
   * @property {Number} hp The HP gained.
   * @property {Number} mp The MP spent.
   * @property {Number} tp The TP increased.
   */

  /**
   * @param {HeroDataModel} system
   * @returns {AH_RecoveryData}
   */
  static calculateRecovery(system) {
    const maxHP = system.resources.hp.max;
    const maxMP = system.resources.mp.max;

    const hp = this.round(maxHP * RECOVERY_HP_GAINED);
    const mp = this.round(maxMP * RECOVERY_MP_SPENT);
    const tp = RECOVERY_TP_ADDED;

    return {
      hp,
      mp,
      tp,
    };
  }

  /**
   * @typedef AH_BlockData
   * @property {Number} hp The HP gained.
   * @property {Number} tp The TP increased.
   */

  /**
   * @param {HeroDataModel|AdversaryDataModel} system
   * @returns {AH_BlockData}
   */
  static calculateBlock(system) {
    const maxHP = system.resources.hp.max;

    let ratio = BLOCK_RATIO_BASE;
    let tp;

    if (system.parameters.block.current) {
      ratio += (system.parameters.block.current / 100);
    }

    if (system.parent.type === "hero") {
      const equippedItems = system.getEquippedItems();
      if (equippedItems.armor) {
        /** @type ArmorDataModel **/
        const armorData = equippedItems.armor.system;
        switch (armorData.category) {
          case "heavy":
            ratio += BLOCK_RATIO_HEAVY_ARMOR;
            break;
          case "light":
            ratio += BLOCK_RATIO_LIGHT_ARMOR;
            break;
        }
      }
      tp = BLOCK_TP_GAINED;
    }
    else if (system.parent.type === "adversary") {
    }

    const hp = this.round(maxHP * ratio);

    return {
      hp,
      tp,
    };
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

  /** @type {Record<string, {attacker: AH_ActionPotency, defense: AH_ActionPotency}>} */
  static #POTENCY_BY_OUTCOME = {
    critical: { attacker: "powerful", defense: "reduced" },
    fumble: { attacker: "reduced", defense: "powerful" },
    success: { attacker: "standard", defense: "reduced" },
    partial: { attacker: "reduced", defense: "standard" },
  };

  /**
   * @param {CheckResult} result
   * @param {Number} difficulty
   * @return {AH_Outcome}
   * @remarks Handles critical thresholds as well.
   */
  static calculateOutcome(result, difficulty) {

    if (result.critical) {
      return "critical";
    } else if (result.fumble) {
      return "fumble";
    }

    if (Number.isInteger(difficulty)) {
      if (result.total >= difficulty) {
        const difference = result.total - difficulty;
        if (difference >= result.criticalThreshold) {
          return "critical";
        }
        return "success";
      } else {
        const difference = difficulty - result.total;
        if (difference >= result.criticalThreshold) {
          return "fumble";
        }
        return "partial";
      }
    }

    return "default"; // Used just for rendering
  }

  /**
   * @param {CheckResult} check
   * @param {Number} difficulty
   * @param {Boolean} defense
   * @return {AH_ActionPotency}
   */
  static calculatePotency(check, difficulty, defense = false) {
    const outcome = this.calculateOutcome(check, difficulty);
    return this.#POTENCY_BY_OUTCOME[outcome][defense ? "defense" : "attacker"];
  }

  /**
   * @description Calculates the change in a clock due to the result of a check
   * @param {Number} result
   * @param {Number} difficulty
   * @param {Boolean} critical
   * @returns {number}
   */
  static calculateTrackChange(result, difficulty, critical) {
    let change = 1;

    const difference = result - difficulty;
    if (difference >= 6) {
      change += 2;
    } else if (difference >= 3) {
      change++;
    }

    if (critical) {
      change += 2;
    }
    return change;
  }

}
