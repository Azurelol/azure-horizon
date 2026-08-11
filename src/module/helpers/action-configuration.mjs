import { systemID } from "../constants.mjs";
import { FoundryUtils, ObjectUtils, StringUtils } from "../utils/_module.mjs";
import { Flags } from "../data/common/_module.mjs";
import { DamageData, ResourceData } from "../pipelines/_module.mjs";
import Targeting from "./targeting.mjs";
import { Formulas } from "../ruleset/_module.mjs";
import AH from "../config.mjs";

// Data keys
const TARGETS = "targets";
const TARGETED_DEFENSE = "targetedDefense";
const DEFENSE_CHECK = "defenseCheck";
const DEFENSE = "defense";
const DIFFICULTY = "difficulty";
const DAMAGE = "damage";
const RESOURCE = "resource";
const EXPENSE = "expenses";
const EFFECTS = "effects";
const FLAGS = "flags";
const TRAITS = "traits";
const WEAPON_TRAITS = "weaponTraits";
const LABEL_KEY = "label";
const CHAT_ACTIONS = "targetedActions";
const WEAPON_USAGE = "weaponUsage";
const ITEM_REFERENCE = "itemReference";
const INITIAL_CHECK = "initialCheck";
const ACTIONS = "actions";
const KEYBOARD_MODIFIERS = "keyboardModifiers";
const ACTION_POTENCIES = "actionPotencies";
const TAGS = "tags";

/**
 * @description Given a {@link CheckResult} object, provides additional information from it
 * @remarks Provides read-only access, to be used after {@linkcode ActionConfig}
 */
export class ActionInspector {

  /**
   * @type {Action|CheckResult|CheckOptions}
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
   * @return {CheckResult}
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
   * @returns {SourceInfo}
   */
  get sourceInfo() {
    return this.#check.sourceInfo;
  }

  /**
   * @returns {DamageData}
   */
  get damage() {
    let dd = this.data[DAMAGE];
    if (dd === undefined) {
      return undefined;
    }
    // Recreate damage data if needed.
    if (!(dd instanceof DamageData)) {
      dd = new DamageData(dd);
    }
    return dd;
  }

  /**
   * @returns {ResourceData}
   */
  get resource() {
    return this.data[RESOURCE];
  }

  /**
   * @returns {ResourceExpense[]}
   */
  get expenses() {
    return this.data[EXPENSE] ?? [];
  }

  /**
   * @returns {ChatAction[]}
   */
  get actions() {
    if (this.data[ACTIONS] === undefined) {
      this.data[ACTIONS] = [];
    }
    return this.data[ACTIONS];
  }

  /**
   * @returns {ActionPotencyTable}
   */
  get potencies() {
    return this.data[ACTION_POTENCIES];
  }

  /**
   *
   * @returns {boolean}
   */
  get hasDamage() {
    return this.damage !== undefined;
  }

  /**
   * @returns {Boolean}
   */
  get hasResource() {
    return this.resource !== undefined;
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
   * @return {AttributeDieRoll}
   */
  get hr() {
    // Not always checks involved
    if ((this.check.primary == null) || (this.check.secondary == null)) {
      return null;
    }
    return this.check.hr;
  }

  /**
   * @returns {AH_Tag[]}
   */
  get tags() {
    return this.data[TAGS] ?? [];
  }

  /**
   * @return {AH_Defense|null}
   */
  getTargetedDefense() {
    return this.data[TARGETED_DEFENSE] ?? null;
  }

  /**
   * @return {Number|null}
   */
  getDifficulty() {
    const difficulty = this.data[DIFFICULTY];
    if (difficulty) {
      return Number.parseInt(difficulty);
    }
    return null;
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
   * @returns {WeaponUsageData}
   */
  get weaponUsage() {
    return this.data[WEAPON_USAGE];
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
    return this.data[TARGETS] ? ObjectUtils.duplicate(this.data[TARGETS]) : [];
  }

  /**
   * @returns {DefenseCheckResult}
   */
  get defenseResults() {
    return this.data[DEFENSE];
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
   * @returns {Boolean}
   */
  get isDefenseCheck() {
    return this.data[DEFENSE_CHECK];
  }

  /**
   * @returns {ChatAction[]}
   */
  get chatActions() {
    return this.data[CHAT_ACTIONS] ?? [];
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

  // TODO: Change to add damage

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
   * @param {(damage: DamageData) => void} callback
   * @return {ActionConfig}
   */
  modifyDamage(callback) {
    const damage = this.damage;
    if (damage) {
      callback(damage);
      this.setData(DAMAGE, damage);
    }
    return this;
  }

  /**
   * @param {ChatAction} action
   */
  addAction(action) {
    const actions = this.actions;
    actions.push(action);
    this.setData(ACTIONS, actions);
  }

  /**
   * @param {(potencies: ActionPotencyTable) => void} callback
   * @return {ActionConfig}
   */
  setPotencies(callback) {
    const potencies = this.potencies ?? {
      reduced: {
        components: [],
      },
      standard: {
        components: [],
      },
      powerful: {
        components: [],
      },
    };
    if (potencies) {
      callback(potencies);
      this.setData(ACTION_POTENCIES, potencies);
    }
    return this;
  }

  /**
   * @desc Sets a resource gain/loss action.
   * @param {AH_Resource} type
   * @param {Number|String} amount
   * @return {ActionConfig}
   */
  setResource(type, amount) {
    this.check.data[RESOURCE] = ResourceData.construct(type, amount);
    this.addTraits(type);
    if (Number.isInteger(amount)) {
      if (amount >= 0) {
        this.addTraits("gain");
      } else {
        this.addTraits("loss");
      }
    } else if (typeof amount === "string") {
      if (amount.startsWith("-")) {
        this.addTraits("loss");
      } else {
        this.addTraits("gain");
      }
    }
    return this;
  }

  /**
   * @param {ResourceExpense} expense
   */
  addExpense(expense) {
    const expenses = this.check.data[EXPENSE] ?? [];
    expenses.push(expense);
    this.check.data[EXPENSE] = expenses;
    return this;
  }

  /**
   * @param {ApplyEffectData|EffectsDataModel} effectData
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
      if (t == null) return;
      const trait = String(t).toLowerCase().trim();
      if (trait !== "") {
        this.check.data[TRAITS].push(trait);
      }
    });
    return this;
  }

  /**
   * @param {AH_Tag|AH_Tag[]} tags
   * @returns {ActionConfig}
   */
  addTags(...tags) {
    if (!this.check.data[TAGS]) {
      this.check.data[TAGS] = [];
    }

    this.check.data[TAGS].push(...tags.flat());
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
   * @param {AH_Defense} targetedDefense
   * @return {ActionConfig}
   */
  setTargetedDefense(targetedDefense) {
    this.check.data[TARGETED_DEFENSE] = targetedDefense;
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
    // A PC-facing defense check is handled differently
    if (this.isDefenseCheck) {
      return;
    }

    const targets = this.getTargets();
    if (targets?.length) {
      if (!this.check.total) {
        return;
      }
      const targetedDefense = this.getTargetedDefense();
      for (let t = 0; t < targets.length; t++) {
        const target = targets[t];
        const difficulty = target.defenses[targetedDefense];
        // Update the original
        this.check.data[TARGETS][t].potency = Formulas.calculatePotency(this.check, difficulty);
      }
    }
  }

  /**
   * Clears target results.
   */
  clearTargetResults() {
    const targets = this.getTargets();
    if (targets?.length) {
      for (let t = 0; t < targets.length; t++) {
        this.check.data[TARGETS][t].potency = "";
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
   * Sets this action to allow the targets to roll a defense check.
   */
  setDefenseCheck(data = {}) {
    this.setData(DEFENSE_CHECK, true);
    this.clearTargetResults();
  }

  /**
   * @param {DefenseCheckResult} defense
   * @returns {ActionConfig}
   */
  updateDefenseResult(defense) {
    this.setData(DEFENSE, defense);
    return this;
  }

  /**
   * @param {WeaponUsageData} usage
   */
  setWeaponUsage(usage) {
    this.setData(WEAPON_USAGE, usage);
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
  addChatAction(action) {
    if (!this.check.data[CHAT_ACTIONS]) {
      this.check.data[CHAT_ACTIONS] = [];
    }
    this.check.data[CHAT_ACTIONS].push(action);
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
