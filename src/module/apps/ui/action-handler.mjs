import { FoundryUtils } from "../../utils/_module.mjs";
import { WeaponResolver } from "../../helpers/weapon-resolver.mjs";
import { ActionConfig, ChatMessageBuilder } from "../../helpers/_module.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import Actions from "../../pipelines/actions.mjs";
import Checks from "../../pipelines/checks.mjs";
import { CheckPrompt } from "../../helpers/check-prompt.mjs";
import AH from "../../config.mjs";

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
    actions.push({
      id: "check",
      label: "AH.ACTION.Check",
      tooltip: "AH.ACTION.CheckHint",
      ctx: "check",
    });
    if (this.actor.type === "hero") {
      actions.push({
        id: "item",
        label: "AH.ACTION.Item",
        tooltip: "AH.ACTION.ItemHint",
        ctx: "item",
      });
    }
    actions.push({
      id: "rest",
      label: "AH.ACTION.Rest",
      tooltip: "AH.ACTION.RestHint",
      ctx: "rest",
    });
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

  /**
   * @return {AH_ContextMenuItem[]}
   */
  getRestActions() {
    /** @type AH_ContextMenuItem[] **/
    let items = [];

    items.push({
      name: "AH.INTERVAL.LongRest.long",
      icon: AH.icons.longRest,
      perform: async () => {
        return this.actor.rest("long");
      },
    });

    if (this.actor.type === "hero") {
      items.push({
        name: "AH.INTERVAL.ShortRest.long",
        icon: AH.icons.shortRest,
        perform: async () => {
          return this.actor.rest("short");
        },
      });
      items.push({
        name: "AH.INTERVAL.Resupply.long",
        icon: AH.icons.resupply,
        perform: async () => {
          return this.actor.rest("resupply");
        },
      });
    }
    else if (this.actor.type === "adversary") {

    }
    return items;
  }

  /**
   * @return {AH_ContextMenuItem[]}
   */
  getChecks() {
    /** @type AH_ContextMenuItem[] **/
    let items = [];
    items.push({
      name: "AH.CHECK.Attribute",
      icon: "ah-icon-check-attribute",
      perform: async () => {
        await CheckPrompt.attributeCheck(this.actor);
      },
    });
    if (this.actor.type === "hero") {
      items.push({
        name: "AH.CHECK.Ritual",
        icon: "ah-icon-check-ritual",
        perform: async () => {
          await CheckPrompt.ritualCheck(this.actor, undefined, {
            initialConfig: {
              primary: "ins",
              secondary: "wlp",
            },
          });
        },
      });
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
      config.addTraits("stress"); // setResource("tp", recovery.tp);
    });
  }

  async performDefense() {
    const block = Formulas.calculateBlock(this.actor.system);

    Actions.perform(this.actor, null, (config, actor, item) => {
      config.setLabel("AH.ACTION.Defend");
      config.setResource("hp", block.hp, true);
      if (block.tp) {
        config.addTraits("stress");
        //config.setResource("tp", block.tp);
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
    // CHECKS
    FoundryUtils.itemContextMenu(element, "[data-context-menu=\"check\"]", this.getChecks(), undefined);
    // REST
    FoundryUtils.itemContextMenu(element, "[data-context-menu=\"rest\"]", this.getRestActions(), undefined);
  }
}
