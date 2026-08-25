import { isActorType, systemID } from "../constants.mjs";
import { FoundryUtils, ObjectUtils, StringUtils } from "../utils/_module.mjs";
import { Flags, SourceInfo } from "../data/common/_module.mjs";
import { DamageData, ResourceData } from "../pipelines/_module.mjs";
import Targeting from "./targeting.mjs";
import { Formulas } from "../ruleset/_module.mjs";
import AH from "../config.mjs";

// Data keys
const ACTOR = "actor";
const ITEM = "item";
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
const WEAPON_USAGE = "weaponUsage";
const ITEM_REFERENCE = "itemReference";
const INITIAL_CHECK = "initialCheck";
const ACTIONS = "actions";
const KEYBOARD_MODIFIERS = "keyboardModifiers";
const ACTION_POTENCIES = "actionPotencies";
const TAGS = "tags";
const DESCRIPTION = "description";
const POWER = "power"; // Preset universal scaling
const GRADE = "grade"; // Attribute scaling
const TARGETING = "targeting";

/**
 * @description Given a {@link CheckResult} object, provides additional information from it
 * @remarks Provides read-only access, to be used after {@linkcode ActionConfig}
 */
export class ActionInspector {

  /**
   * @type {Action|CheckResult|CheckOptions}
   */
  #action;

  constructor(data) {
    if (data instanceof ChatMessage) {
      data = data.getFlag(systemID, Flags.ChatMessage.Check);
    }
    else if (isActorType(data)) {
      data = {
        id: foundry.utils.randomID(),
        data: {},
        actorUuid: data.uuid,
        item: undefined,
        sourceInfo: SourceInfo.fromInstance(data, undefined),
      };
    }
    this.#action = data;
  }

  //----------------------------------------------------------/
  /**
   * @return {Action|CheckResult|CheckOptions}
   */
  get check() {
    return this.#action;
  }

  /**
   * @returns {AHActor}
   */
  get actor() {
    return fromUuidSync(this.check.actorUuid);
  }

  /**
   * @returns {Object}
   */
  get data() {
    return this.#action.data;
  }

  /**
   * @param key
   * @param value
   */
  setData(key, value) {
    ObjectUtils.setProperty(this.#action.data, key, value);
  }
  //----------------------------------------------------------/

  /**
   * @returns {CheckResult} Present for some scenarios.
   */
  get initialCheck() {
    return this.data[INITIAL_CHECK];
  }

  /**
   * @returns {boolean}
   */
  get isCheck() {
    return this.#action.type === "action";
  }

  /**
   * @returns {SourceInfo}
   */
  get sourceInfo() {
    return this.#action.sourceInfo;
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
   * @returns {(ChatAction|Promise<ChatAction>)[]}
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
   * @returns {AH_Grade}
   */
  get grade() {
    return this.data[GRADE];
  }

  /**
   * @returns {String[]}
   */
  get description() {
    return this.data[DESCRIPTION] ?? [];
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
  get effects() {
    const data = this.data[EFFECTS];
    if (data) {
      return data;
    }
    return undefined;
  }

  /**
   * @returns {boolean}
   */
  get hasEffects() {
    return this.effects !== undefined;
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
   * @returns {AH_TargetingRule} Optional label for this check
   */
  getTargeting() {
    return this.data[TARGETING];
  }

  /**
   * @returns {Boolean}
   */
  get isDefenseCheck() {
    return this.data[DEFENSE_CHECK];
  }

  /**
   * @returns {AH_Power|undefined}
   */
  get power() {
    return this.data[POWER];
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
   * @param {DamageUnit} unit
   * @return {ActionConfig}
   */
  setDamage(unit) {
    this.setData(DAMAGE, DamageData.initialize(unit));
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
   * @param {ChatAction|Promise<ChatAction>} action
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
  setPotency(callback) {
    const tiers = this.potencies ?? {
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
    if (tiers) {
      callback(tiers);
      this.setData(ACTION_POTENCIES, tiers);
    }
    return this;
  }

  /**
   * @desc Sets a resource gain/loss action.
   * @param {AH_Resource} type
   * @param {Number|String} amount
   * @param {Boolean} temp
   * @return {ActionConfig}
   */
  setResource(type, amount, temp = false) {
    this.check.data[RESOURCE] = ResourceData.initialize(type, amount, temp);
    if (temp && (type === "hp")) {
      this.addTraits("thp");
    }
    else {
      this.addTraits(type);
    }
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
    this.check.data[EFFECTS] = ObjectUtils.safeClone(effectData);
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
   * @param {String[]|String} traits
   * @returns {ActionConfig}
   */
  removeTraits(...traits) {
    if (!this.check.data[TRAITS]) {
      this.check.data[TRAITS] = [];
    }

    const toRemove = new Set(
      traits
        .flat()
        .filter((t) => t != null)
        .map((t) => String(t).toLowerCase().trim())
        .filter((t) => t !== ""),
    );

    this.check.data[TRAITS] = this.check.data[TRAITS].filter(
      (t) => !toRemove.has(t),
    );

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
   * @param {AH_Potency} potency If set, it will override the calculation.
   * @remarks Invoked whenever targets or targeted defense change
   */
  updateTargetResults(potency) {
    // A PC-facing defense check is handled differently
    if (this.isDefenseCheck) {
      return;
    }

    const targets = this.getTargets();
    if (targets?.length) {
      // If overriding potency
      if (potency) {
        for (let t = 0; t < targets.length; t++) {
          this.check.data[TARGETS][t].potency = potency;
        }
        return;
      }

      // If there's an actual check
      if (!this.check.total) {
        return;
      }
      const targetedDefense = this.getTargetedDefense();
      for (let t = 0; t < targets.length; t++) {
        const target = targets[t];
        // Character types
        if (target.defenses) {
          const difficulty = target.defenses[targetedDefense];
          this.check.data[TARGETS][t].potency = Formulas.calculatePotency(this.check, difficulty);
        }
        // Entity types (always hit)
        else {
          this.check.data[TARGETS][t].potency = "standard";
        }
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
          if (!token.actor.isEntityType) {
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
   * @param {String} text
   * @returns {ActionConfig}
   */
  addDescription(text) {
    const desc = this.description ?? [];
    desc.push(text);
    this.setData(DESCRIPTION, desc);
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
    return this;
  }

  /**
   * @desc Set a custom label for the check
   * @param {String} label
   */
  setLabel(label) {
    this.check.data[LABEL_KEY] = label;
    return this;
  }

  /**
   * @param {CheckResult} check
   */
  setInitialCheck(check) {
    this.check.data[INITIAL_CHECK] = check;
    return this;
  }

  /**
   * @param {AHItem} item
   * @remarks Sometimes used when a check is made due to an item (but not DIRECTLY by the item in question).
   */
  setItemReference(item) {
    this.check.data[ITEM_REFERENCE] = item.uuid;
    return this;
  }

  /**
   * @param {AH_Power} power
   */
  setPower(power) {
    this.data[POWER] = power;
    return this;
  }

  /**
   * @param {AH_Grade} grade
   */
  setGrade(grade) {
    this.check.data[GRADE] = grade;
  }

  /**
   * @param {AH_TargetingRule} rule
   */
  setTargeting(rule) {
    this.check.data[TARGETING] = rule;
  }
}
