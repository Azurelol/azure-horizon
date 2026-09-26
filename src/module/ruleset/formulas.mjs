// CHARACTERS
import AH, { scaleValue } from "../config.mjs";

const MIN_ATTRIBUTE_DIE = 4;
const MAX_ATTRIBUTE_DIE = 20; // L90
const BASE_DAMAGE = 5;

const HP_MIGHT_FACTOR = 5;
const MP_WILLPOWER_FACTOR = 5;
const HP_POTENTIAL_FACTOR = 10;

const IP_BASE = 6;
const TP_BASE = 2;

// CLASS BENEFITS
const CLASS_BENEFIT_HP = 10;
const CLASS_BENEFIT_MP = 10;
const CLASS_BENEFIT_TP = 2;
const CLASS_BENEFIT_IP = 2;

// RECOVERY
const RECOVERY_HP_BASE = 5;
const RECOVERY_HP_BONUS_LIGHT = 2;
const RECOVERY_HP_GAINED_BASE = 0.1;
const RECOVERY_MP_SPENT_BASE = 0.2;
const RECOVERY_TP_ADDED_BASE = 1;

// BLOCK
const BLOCK_BASE = BASE_DAMAGE;
const BLOCK_BONUS_HEAVY = 2;
const BLOCK_BONUS_ARMOR_HEAVY = 4;
const BLOCK_BONUS_SHIELD = 4;
const BLOCK_BONUS_ADVERSARY = 5;
const BLOCK_TP_GAINED = 1;

const MOVEMENT_MIN = 1;
const EQUIPMENT_IP_BONUS = 2;
const XP_PER_LEVEL = 10;

// TRAVEL
const TRAVEL_DISCOVERY_RESULT = 1;
const TRAVEL_DANGER_THRESHOLD = 6;

// HP THRESHOLDS
const PERIL_THRESHOLD = 0.5;
const CRISIS_THRESHOLD = 0.2;

// STATUS EFFECTS
const STATUS_CHAMPION_MODIFIER = 0.5;
const STATUS_BURN_RATIO = 0.1;
const STATUS_MIASMA_RATIO = 0.1;

// PRESSURE
const PP_BASE = 8;
const PRESSURE_RESISTANCE_FACTOR = 6;

/**
 * @typedef Modifier
 * @property {Number} additive Should default to 0.
 * @property {Number} multiplicative Should default to 1.
 * @property {Boolean} valid It's valid if it's not at default values.
 */

/**
 * @typedef {Modifier} ParameterModifier
 * @property {AH_Modifier} key
 * @property {ModifierSource} source
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

/**
 * @param {HeroDataModel} system
 * @param {(EquippedItems) => void} onEquipment
 */
function forEquipment(system, onEquipment) {
  if (system.parent.type === "hero") {
    const equipment = system.equipment.equipped;
    onEquipment(equipment);
  }
}

/**
 * @param {HeroDataModel} system
 * @param {(AH_EquipmentWeight) => void} onEquipment
 */
function forEquipmentWeight(system, onEquipment) {
  if (system.parent.type === "hero") {
    const equipment = system.equipment.equipped;
    const weights = [equipment.armor?.system.weight,
      equipment.mainHand?.system.weight].filter(Boolean);
    for (const weight of weights) {
      onEquipment(weight);
    }
  }
}

export default class Formulas {

  /**
   * @param {ActorResourceDataModel} hp
   */
  static inCrisis(hp) {
    const percent = hp.value / hp.max;
    return percent <= CRISIS_THRESHOLD;
  }

  /**
   * @param {ActorResourceDataModel} hp
   */
  static inPeril(hp) {
    const percent = hp.value / hp.max;
    return percent <= PERIL_THRESHOLD;
  }

  // TODO: Use for checks???
  /**
   * @param {Number} level
   * @returns {Number}
   */
  static calculateProficiencyBonus(level) {
    return Math.round(level / 10);
  }

  /**
   * @typedef LevelCalculation
   * @property levelsGained
   * @property remainingExperience
   */

  /**
   * @param xp
   * @returns LevelCalculation
   */
  static calculateLevelsGained(xp) {
    const levels = Math.floor(xp / XP_PER_LEVEL);
    const remaining = xp % XP_PER_LEVEL;
    return {
      levelsGained: levels,
      remainingExperience: remaining,
    };

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
   * @typedef AttributeCalculation
   * @property primary.base
   * @property primary.bonus
   * @property secondary.base
   * @property secondary.bonus
   */

  /**
   * @param {ActionConfig} config
   * @param {AHActor} actor
   * @return {AttributeCalculation}
   */
  static calculateAttributeBonus(config, actor) {
    if (!actor.isCharacterType) {
      return undefined;
    }
    if (config.isCheck) {
      let grade = AH.grades[config.grade].scale;

      return {
        primary: {
          base: config.check.hr.result,
          bonus: Math.floor ((config.check.hr?.result * grade) - config.check.hr.result),
        },
        secondary: {
          base: config.check.lr.result,
          bonus: 0, // Math.floor((config.check.lr?.result * grade) - config.check.lr?.result),
        },
      };
    }
    else {
      const scale = AH.grades.E.scale;
      const attributes = actor.system.attributes;
      const primary = config.check.primary ? attributes[config.check.primary].current * scale : undefined;
      const secondary = config.check.secondary ? attributes[config.check.secondary].current * scale : undefined;
      return {
        primary: {
          base: primary,
          bonus: 0,
        },
        secondary: {
          base: secondary,
          bonus: 0,
        },
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
   * @typedef HitPointFactors
   * @property level A level different from the serialized one.
   * @property turns
   */

  /**
   * @param {EntityDataModel|HeroDataModel|AdversaryDataModel|FollowerDataModel} system
   * @param {HitPointFactors} factors A level different from the serialized one.
   * @returns {Number}
   */
  static calculateHitPoints(system, factors = {}) {
    /** @type AHActor **/
    const actor = system.parent;
    factors.level ??= system.level;
    let hp = 0;
    switch (actor.type) {

      case "hero": {
        /** @type AttributesDataModel **/
        const attributes = system.attributes;
        hp += factors.level + (attributes.mig.base * HP_MIGHT_FACTOR);
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
        const turns = factors.turns ?? profile.turns;
        switch (profile.rank) {
          case "minion":
            hp = Math.round(factors.level / 5);
            break;

          default:
            hp = (factors.level + (attributes.mig.base * HP_MIGHT_FACTOR)) * turns;
            break;
        }

        break;
      }

      case "follower": {
        hp = factors.level;
        const potential = system.potential;
        hp += (HP_POTENTIAL_FACTOR * potential);
      }
        break;

      case "entity": {
        hp = factors.level;
      }
        break;

      case "unit":
        hp = factors.level;
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
          mp += CLASS_BENEFIT_MP;
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
        ip += CLASS_BENEFIT_IP;
      }
    });
    forEquipment(system, equipped => {
      if (equipped.armor?.system.weight === "light") {
        ip += EQUIPMENT_IP_BONUS;
      }
    });
    return ip;
  }

  /**
   * @param {HeroDataModel} system
   * @returns {Number}
   */
  static calculateTensionPoints(system) {
    const wlp = system.attributes.wlp.current;
    let tp = TP_BASE + system.attributes.wlp.current;
    if (system.parent.type === "hero") {
      forClassBenefits(system.parent, benefits => {
        if (benefits.tp) {
          tp += CLASS_BENEFIT_TP;
        }
      });
    }
    return tp;
  }

  /**
   * @param {AdversaryDataModel} system
   * @returns {Number}
   */
  static calculatePressurePoints(system) {
    if (!system.ranked) {
      return 0;
    }
    // TODO: Successive staggers will increase the value
    let resistanceAddend = 0;
    const staggerResistance = system.parent.resolveEffect("stagger-resistance");
    if (staggerResistance) {
      resistanceAddend += PRESSURE_RESISTANCE_FACTOR * staggerResistance.system.tracker.current;
    }

    switch (system.profile.rank) {
      case "elite":
        return PP_BASE + resistanceAddend;
      case "champion":
        return PP_BASE + (system.profile.turns * 2) + resistanceAddend;
    }
  }

  /**
   * @param {CharacterDataModel} system
   * @returns {Number}
   */
  static calculateDefense(system) {
    const attributes = system.attributes;
    const bonus = Formulas.calculateProficiencyBonus(system.level);
    return this.round((attributes.dex.current + attributes.mig.current) / 2) + bonus;
  }

  /**
   * @param {CharacterDataModel} system
   * @returns {Number}
   */
  static calculateMagicDefense(system) {
    const attributes = system.attributes;
    const bonus = Formulas.calculateProficiencyBonus(system.level);
    return this.round((attributes.wlp.current + attributes.ins.current) / 2) + bonus;
  }

  /**
   * @param {CharacterDataModel} system
   * @returns {Number}
   */
  static calculateInitiative(system) {
    const attributes = system.attributes;
    let bonus = Formulas.calculateProficiencyBonus(system.level);
    forEquipmentWeight(system, weight => {
      switch (weight) {
        case "heavy":
          bonus--;
          break;
      }
    });
    return this.round((attributes.dex.current + attributes.ins.current) / 2) + bonus;
  }

  // TODO: Remove?
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

    let mpFactor = RECOVERY_MP_SPENT_BASE;
    let tpAdded = RECOVERY_TP_ADDED_BASE;

    let base = RECOVERY_HP_BASE;
    let bonus = 0;

    if (system.parent.type === "hero") {
      const equipment = system.equipment.equipped;
      const weights = [equipment.armor?.system.weight,
        equipment.mainHand?.system.weight].filter(Boolean);
      for (const weight of weights) {
        if (weight === "light") {
          bonus += RECOVERY_HP_BONUS_LIGHT;
        }
        else if (weight === "heavy") {
          tpAdded += 1;
        }
      }
    }

    bonus += (maxHP * RECOVERY_HP_GAINED_BASE);

    const hp = base + bonus + system.proficiency;
    let mp = this.round(maxMP * mpFactor);
    let tp = tpAdded;

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
    const base = BLOCK_BASE;
    let bonus = 0;

    //let ratio = BLOCK_RATIO_BASE;
    let tp;

    if (system.parameters.block.current) {
      bonus += system.parameters.block.current;
      //ratio += (system.parameters.block.current / 100);
    }

    if (system.parent.type === "hero") {
      const equipment = system.equipment.equipped;
      if (equipment.armor?.system.weight === "heavy") {
        bonus += BLOCK_BONUS_ARMOR_HEAVY;
      }
      const weapons = new Set([equipment.mainHand, equipment.offHand].filter(Boolean));
      for (const weapon of weapons) {
        if (weapon.system.weight === "heavy") {
          bonus += BLOCK_BONUS_HEAVY;
        }
        if (weapon.system.traits.has("shield")) {
          bonus += BLOCK_BONUS_SHIELD;
        }
      }
      tp = BLOCK_TP_GAINED;
    }
    else if (system.parent.type === "adversary") {
      bonus += BLOCK_BONUS_ADVERSARY;
    }

    const hp = base + bonus + system.proficiency;

    return {
      hp,
      tp,
    };
  }

  /**
   * @param {HeroDataModel|AdversaryDataModel} system
   * @returns {Number}
   */
  static calculateMovement(system) {
    let result = 1;
    forEquipment(system, equipped => {
      if (equipped.armor) {
        if (equipped.armor?.system.weight === "light") {
          result += 1;
        }
      }
      else {
        result += 1;
      }

    });
    return Math.max(MOVEMENT_MIN, result);
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
    if (outcome === "default") {
      return "standard";
    }
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

  /**
   * @param {Number} result
   * @return AH_TravelResult
   */
  static resolveTravelCheck(result) {
    if (result >= TRAVEL_DANGER_THRESHOLD) {
      return "danger";
    }
    else if (result === TRAVEL_DISCOVERY_RESULT) {
      return "discovery";
    }
    return "none";
  }

  /**
   * @typedef StatusResourceChange
   * @property hp
   * @property {AH_DamageType} type
   * @property mp
   * @property tp
   */

  /**
   * @param {AHActor} actor
   * @param {AH_StatusEffect} status
   * @return {StatusResourceChange}
   */
  static calculateStatusDamage(actor, status) {
    // Higher ranks don't suffer as much
    let rankModifier = 1;
    if (actor.type === "adversary") {
      rankModifier = 1 / actor.system.profile.turns;
    }

    const maxHP = actor.system.resources.hp.max;
    const maxMP = actor.system.resources.mp.max;
    let hp, mp, tp;
    let type;

    switch (status) {
      case "burn":
        hp = maxHP * STATUS_BURN_RATIO * rankModifier;
        type = "fire";
        break;

      case "miasma":
        mp = maxMP * STATUS_MIASMA_RATIO * rankModifier;
        break;
    }

    if (hp || mp || tp) {
      return {
        hp,
        mp,
        tp,
        type,
      };
    }
    return undefined;
  }
}
