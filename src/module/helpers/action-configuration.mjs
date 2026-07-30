import { systemID } from "../constants.mjs";
import { FoundryUtils, ObjectUtils, StringUtils } from "../utils/_module.mjs";
import { Targeting } from "./targeting.mjs";
import { Flags } from "../data/common/_module.mjs";
import { DamageData } from "../pipelines/_module.mjs";

// Data keys
const TARGETS = "targets";
const TARGETED_DEFENSE = "targetedDefense";
const DIFFICULTY = "difficulty";
const DAMAGE = "damage";
const RESOURCE = "resource";
const EXPENSE = "expenses";
const EFFECTS = "effects";
const TRAITS = "traits";
const WEAPON_TRAITS = "weaponTraits";
const LABEL_KEY = "label";
const TARGETED_ACTIONS = "targetedActions";
const WEAPON_USED = "weaponUsedBySkill";
const ITEM_REFERENCE = "itemReference";
const INITIAL_CHECK = "initialCheck";
const HR_ZERO = "hrZero";

/**
 * @param {boolean} hrZero
 * @return {CheckPrepareCallback}
 */
const initHrZero = (hrZero) => (check) => {
  hrZero && (check.data[HR_ZERO] = true);
};

/**
 * @typedef Action
 * @property {Object} data
 */

/**
 * @description Given a {@link CheckResult} object, provides additional information from it
 * @remarks Provides read-only access, to be used after {@linkcode ActionConfig}
 */
export class ActionInspector {

  /**
   * @type {CheckResult|CheckOptions}
   */
  #check;

  constructor(check) {
    if (check instanceof ChatMessage) {
      check = check.getFlag(systemID, Flags.ChatMessage.Check);
    }
    this.#check = check;
  }

  //----------------------------------------------------------/
  /**
   * @return {CheckOptions}
   */
  get check() {
    return this.#check;
  }

  /**
   * @returns {Object}
   */
  get data() {
    return this.#check.data;
  }

  /**
   * @param key
   * @param value
   */
  setData(key, value) {
    ObjectUtils.setProperty(this.#check.data, key, value);
  }
  //----------------------------------------------------------/

  /**
   * @returns {CheckResult} Present for some scenarios.
   */
  get initialCheck() {
    return this.data[INITIAL_CHECK];
  }

  /**
   * @returns {DamageData}
   */
  get damage() {
    return this.data[DAMAGE];
  }

  /**
   * @returns {ApplyEffectData|null}
   */
  getEffects() {
    const data = this.data[EFFECTS];
    if (data) {
      return data;
    }
    return null;
  }

  /**
   * @return {boolean|null}
   */
  getHrZero() {
    return this.data[HR_ZERO] ?? null;
  }

  /**
   * @return {Number}
   */
  getHighRoll() {
    // Not always checks involved
    if ((this.check.primary == null) || (this.check.secondary == null)) {
      return 0;
    }
    return Math.max(this.check.primary.result, this.check.secondary.result);
  }

  /**
   * @return {AH_Defense|null}
   */
  getTargetedDefense() {
    return this.data[TARGETED_DEFENSE] ?? null;
  }

  /**
   * @return {number|null}
   */
  getDifficulty() {
    return this.data[DIFFICULTY] ?? null;
  }

  /**
   * @return {String[]}
   */
  getTraits() {
    return this.data[TRAITS] ?? [];
  }

  /**
   * @param trait
   * @returns {Boolean}
   */
  hasTrait(trait) {
    return this.getTraits().includes(trait);
  }

  /**
   * @returns {String} The uuid of the item that this check is associated with.
   */
  getItemReference() {
    return this.data[ITEM_REFERENCE] ?? null;
  }

  /**
   * @returns {String} The uuid of the weapon used.
   */
  getWeaponReference() {
    return this.data[WEAPON_USED];
  }

  /**
   * @return WeaponTraits
   */
  getWeaponTraits() {
    return this.data[WEAPON_TRAITS] ?? {};
  }

  /**
   * @return {TargetData[]}
   */
  getTargets() {
    return this.data[TARGETS] ? ObjectUtils.duplicate(this.data[TARGETS]) : null;
  }

  /**
   * @return {TargetData[]}
   */
  getTargetsOrDefault() {
    return this.getTargets() || [];
  }

  /**
   * @returns {Boolean}
   */
  isCritical() {
    return this.check.critical;
  }

  /**
   * @returns {Boolean}
   */
  isFumble() {
    return this.check.fumble;
  }

  /**
   * @returns {String|undefined} Optional label for this check
   */
  getLabel() {
    return this.data[LABEL_KEY];
  }

  /**
   *@returns {ChatAction[]}
   */
  getTargetedActions() {
    return this.data[TARGETED_ACTIONS] ?? [];
  }
}

/**
 * @desc Provides an interface for configuring a check as it is processed
 * @extends ActionInspector
 * @inheritDoc
 */
export class ActionConfig extends ActionInspector {
  /**
   * @param {AH_Attribute} primary
   * @param {AH_Attribute} secondary
   */
  setAttributes(primary, secondary) {
    this.check.primary = primary;
    this.check.secondary = secondary;
  }

  /**
   * @param {AH_DamageType} type
   * @param {Number} baseDamage
   * @return {ActionConfig}
   */
  setDamage(type, baseDamage) {
    this.setData(DAMAGE, DamageData.construct(type, baseDamage));
    return this;
  }

  /**
   * @param {(damage: DamageData) => DamageData} callback
   * @return {ActionConfig}
   */
  modifyDamage(callback) {
    const damage = this.damage;
    if (damage) {
      this.setData(DAMAGE, callback(damage));
    }
    return this;
  }

  /**
   * @param {ApplyEffectData|EffectApplicationDataModel} effectData
   */
  setEffects(effectData) {
    // We make a deep copy here since this will be modified during pipelines
    this.check.data[EFFECTS] = FoundryUtils.safeClone(effectData);
    return this;
  }

  /**
   * @param {...(string|Iterable<string>)} effects
   * @return {ActionConfig}
   */
  addEffects(...effects) {
    if (this.getEffects() === null) {
      this.check.data[EFFECTS] = {
        entries: [],
      };
    }

    const entries = this.check.data[EFFECTS].entries;

    for (const effect of effects) {
      if (Array.isArray(effect)) {
        entries.push(...effect);
      } else {
        entries.push(effect);
      }
    }

    return this;
  }

  /**
   * @param {String[]|String} traits
   * @returns {ActionConfig}
   */
  addTraits(...traits) {
    if (!this.check.data[TRAITS]) {
      this.check.data[TRAITS] = [];
    }

    traits.flat().forEach((t) => {
      if (t != null) {
        this.check.data[TRAITS].push(String(t).toLowerCase());
      }
    });
    return this;
  }

  /**
   * @param {Set<String>} traits
   * @returns {ActionConfig}
   * @remarks In the item's data model they are serialized in title case
   */
  addTraitsFromItemModel(traits) {
    this.addTraits(...Array.from(traits, StringUtils.titleToKebab));
    return this;
  }
  /**
   * @description A modifier to the check (accuracy)
   * @param {String} label
   * @param {Number} value
   * @return {ActionConfig}
   */
  addModifier(label, value) {
    this.check.modifiers.push({
      label: label,
      value: value,
    });
    return this;
  }

  /**
   * @param {boolean} hrZero
   * @return {ActionConfig}
   */
  setHrZero(hrZero) {
    this.check.data[HR_ZERO] = hrZero;
    return this;
  }

  /**
   * @param {(hrZero: boolean | null) => boolean | null} callback
   * @return {ActionConfig}
   */
  modifyHrZero(callback) {
    const hrZero = this.check.data[HR_ZERO] ?? null;
    this.check.data[HR_ZERO] = callback(hrZero);
    return this;
  }

  /**
   * @param {AH_Defense} targetedDefense
   * @return {ActionConfig}
   */
  setTargetedDefense(targetedDefense) {
    this.check.data[TARGETED_DEFENSE] = targetedDefense;
    this.updateTargetResults();
    return this;
  }

  /**
   * @param {(targetedDefense: AH_Defense | null) => AH_Defense | null} callback
   * @return {ActionConfig}
   */
  modifyTargetedDefense(callback) {
    const targetedDefense = this.check.data[TARGETED_DEFENSE] ?? null;
    return this.setTargetedDefense(callback(targetedDefense));
  }

  /**
   * @param {TargetData[]} targets
   * @return {ActionConfig}
   */
  setTargets(targets) {
    this.check.data[TARGETS] = [...targets];
    this.updateTargetResults();
    return this;
  }

  /**
   * @remarks Invoked whenever targets or targeted defense change
   */
  updateTargetResults() {
    const targets = this.getTargets();
    if (targets?.length) {
      if (!this.check.total) {
        return;
      }
      const targetedDefense = this.getTargetedDefense();
      for (let t = 0; t < targets.length; t++) {
        const target = targets[t];
        const difficulty = target.defenses[targetedDefense];
        let targetResult;
        if (this.check.critical) {
          targetResult = "hit";
        } else if (this.check.fumble) {
          targetResult = "miss";
        } else {
          targetResult = this.check.total >= difficulty ? "hit" : "miss";
        }
        // Update the original
        this.check.data[TARGETS][t].total = targetResult;
      }
    }
  }

  /**
   * @description Assign actors currently targeted by the users
   * @return {ActionConfig}
   */
  setDefaultTargets() {
    return this.setTargets(
      [...game.user.targets]
        .filter((token) => !!token.actor)
        .map((token) => {
          if (!token.actor.isCharacterType) {
            ui.notifications.error("AH.DIALOG.InvalidTarget", { localize: true });
            throw Error("Only character types can be targeted");
          }
          return Targeting.constructData(token.actor);
        }),
    );
  }

  /**
   * @param {(targets: TargetData[] | null) => TargetData[] | null} callback
   * @return {ActionConfig}
   */
  modifyTargets(callback) {
    const targets = this.check.data[TARGETS] ?? null;
    return this.setTargets(callback(targets));
  }

  /**
   * @param {number} difficulty
   * @return {ActionConfig}
   */
  setDifficulty(difficulty) {
    this.check.data[DIFFICULTY] = difficulty;
    return this;
  }

  /**
   * @param {(difficulty: number | null) => number | null} callback
   * @return {ActionConfig}
   */
  modifyDifficulty(callback) {
    const difficulty = this.check.data[DIFFICULTY] ?? null;
    this.check.data[DIFFICULTY] = callback(difficulty);
    return this;
  }

  /**
   * @desc Set a custom label for the check
   * @param {String} label
   */
  setLabel(label) {
    this.check.data[LABEL_KEY] = label;
  }

  /**
   * @param {ChatAction} action
   * @remarks Will reject adding duplicates.
   */
  addTargetedAction(action) {
    if (!this.check.data[TARGETED_ACTIONS]) {
      this.check.data[TARGETED_ACTIONS] = [];
    }
    this.check.data[TARGETED_ACTIONS].push(action);
  }

  /**
   * @param {CheckResult} check
   */
  setInitialCheck(check) {
    this.check.data[INITIAL_CHECK] = check;
  }

  /**
   * @param {AHItem} item
   * @remarks Sometimes used when a check is made due to an item (but not DIRECTLY by the item in question).
   */
  setItemReference(item) {
    this.check.data[ITEM_REFERENCE] = item.uuid;
  }
}
