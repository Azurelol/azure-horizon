import { FoundryUtils } from "../../utils/_module.mjs";
import { WeaponResolver } from "../../helpers/weapon-resolver.mjs";
import { ActionConfig, ChatMessageBuilder } from "../../helpers/_module.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import Actions from "../../pipelines/actions.mjs";

/**
 * @desc Encapsulates basic character actions.
 * @property {AHActor} actor
 * @property {Number} bonus
 */
export default class ActionHandler {

  constructor(actor) {
    this.actor = actor;
    this.bonus = 0;
  }

  /**
   * @param {Number} bonus
   */
  withBonus(bonus) {
    this.bonus = bonus;
    return this;
  }

  /**
   * @param {AH_Action} actionType
   * @param isShift
   * @returns {Promise<void>}
   */
  async handleAction(actionType, isShift = false) {
    if (!isShift) {
      switch (actionType) {
        case "attack":
          return this.attack();
      }
    } else {
    }
  }

  /**
   * @desc Performs an attack with one of the equipped weapons or attacks.
   * @returns {Promise<void>}
   */
  async attack() {
    const resolution = await WeaponResolver.prompt(this.actor);
    if (resolution?.item) {
      resolution.item.roll();
    }
  }

  /**
   * @typedef AH_CharacterAction
   * @property id
   * @property label
   * @property tooltip
   * @property ctx The context menu
   * @property type The type of character.
   */

  /**
   *
   * @returns {AH_CharacterAction[]}
   */
  getMenuActions() {
    /** @type AH_CharacterAction[] **/
    let actions = [];
    actions.push({
      id: "attack",
      label: "AH.ACTION.Attack",
      tooltip: "AH.ACTION.AttackHint",
      ctx: "attack",
    });
    if (this.actor.type === "hero") {
      actions.push({
        id: "skill",
        label: "AH.ACTION.Skill",
        tooltip: "AH.ACTION.SkillHint",
        type: "hero",
        ctx: "skill",
      });
      actions.push({
        id: "spell",
        label: "AH.ACTION.Spell",
        tooltip: "AH.ACTION.SpellHint",
        type: "hero",
        ctx: "spell",
      });
    }
    else if (this.actor.type === "adversary") {
      actions.push({
        id: "ability",
        label: "AH.ACTION.Ability",
        tooltip: "AH.ACTION.AbilityHint",
        type: "adversary",
        ctx: "ability",
      });
    }
    actions.push({
      id: "maneuver",
      label: "AH.ACTION.Maneuver",
      tooltip: "AH.ACTION.ManeuverHint",
      ctx: "maneuver",
    });
    if (this.actor.type === "hero") {
      actions.push({
        id: "item",
        label: "AH.ACTION.Item",
        tooltip: "AH.ACTION.ItemHint",
        ctx: "item",
      });
    }
    return actions;
  }

  /**
   * @return {AH_ContextMenuItem[]}
   */
  getManeuvers() {
    /** @type AH_ContextMenuItem[] **/
    let items = [];
    items.push({
      name: "AH.ACTION.Defend",
      icon: "ah-icon-defend",
      perform: async () => {
        await this.performDefense();
      },
    });
    if (this.actor.type === "hero") {
      items.push({
        name: "AH.ACTION.Recover",
        icon: "ah-icon-recover",
        perform: async () => {
          await this.performRecovery();
        },
      });
    }
    else if (this.actor.type === "adversary") {

    }
    return items;
  }

  async performRecovery() {
    const recovery = Formulas.calculateRecovery(this.actor.system);

    Actions.perform(this.actor, null, (config, actor, item) => {
      config.setLabel("AH.ACTION.Recover");
      config.setResource("hp", recovery.hp);
      config.addExpense({
        source: "skill",
        resource: "mp",
        amount: recovery.mp,
      });
      config.addExpense({
        source: "skill",
        resource: "tp",
        amount: recovery.tp,
      });
    });
  }

  async performDefense() {
    const block = Formulas.calculateBlock(this.actor.system);

    Actions.perform(this.actor, null, (config, actor, item) => {
      config.setLabel("AH.ACTION.Defend");
      config.setResource("hp", block.hp, true);
      if (block.tp) {
        config.addExpense({
          source: "skill",
          resource: "tp",
          amount: block.tp,
        });
      }
    });
  }

  /**
   * @param {HTMLElement} element
   */
  setupMenu(element) {
    // ATTACKS
    const attacks = WeaponResolver.getEquippedWeapons(this.actor);
    FoundryUtils.itemContextMenu(element, "[data-context-menu=\"attack\"]", attacks, undefined, true);
    // SPELLS
    const spells = ["spell"].map((t) => this.actor.getItemsByType(t)).flat();
    FoundryUtils.itemContextMenu(element, "[data-context-menu=\"spell\"]", spells);
    // INVENTORY
    const consumables = this.actor.getItemsByType("consumable");
    FoundryUtils.itemContextMenu(element, "[data-context-menu=\"item\"]", consumables);
    if (this.actor.type === "hero") {
      // EQUIPMENT
      const weapons = this.actor.getItemsByType("weapon");
      FoundryUtils.itemContextMenu(element, "[data-slot=\"mainHand\"]", weapons, async item => {
        this.actor.system.equipItem(item, "mainHand");
      });
      FoundryUtils.itemContextMenu(element, "[data-slot=\"offHand\"]", weapons, async item => {
        this.actor.system.equipItem(item, "offHand");
      });
      const armors = this.actor.getItemsByType("armor");
      FoundryUtils.itemContextMenu(element, "[data-slot=\"armor\"]", armors, async item => {
        this.actor.system.equipItem(item);
      });
      const accessories = this.actor.getItemsByType("accessory");
      FoundryUtils.itemContextMenu(element, "[data-slot=\"accessory1\"]", accessories, async item => {
        this.actor.system.equipItem(item, "accessory1");
      });
      FoundryUtils.itemContextMenu(element, "[data-slot=\"accessory2\"]", accessories, async item => {
        this.actor.system.equipItem(item, "accessory2");
      });
      // SKILLS
      /** @type {AHItem[]} **/
      let skills = ["skill"]
        .map((t) => this.actor.getItemsByType(t))
        .flat()
        .filter((s) => {
          return s.system.action.type === "action";
        });
      FoundryUtils.itemContextMenu(element, "[data-context-menu=\"skill\"]", skills);
    }
    else if (this.actor.type === "adversary") {
      // ABILITIES
      let abilities = this.actor.getItemsByType("ability").filter(a => a.system.action.type === "action");
      FoundryUtils.itemContextMenu(element, "[data-context-menu=\"ability\"]", abilities);
    }
    // MANEUVER
    FoundryUtils.itemContextMenu(element, "[data-context-menu=\"maneuver\"]", this.getManeuvers(), undefined);
  }
}
