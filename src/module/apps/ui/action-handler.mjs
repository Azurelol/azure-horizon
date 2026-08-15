import { FoundryUtils } from "../../utils/_module.mjs";
import { WeaponResolver } from "../../helpers/weapon-resolver.mjs";

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
   * @param {HTMLElement} element
   */
  setupMenu(element) {
    // ATTACKS
    const attacks = WeaponResolver.getEquippedWeapons(this.actor);
    FoundryUtils.itemContextMenu(element, "[data-context-menu=\"attack\"]", attacks, undefined, true);
    // SPELLS
    const spells = ["spell"].map((t) => this.actor.getItemsByType(t)).flat();
    FoundryUtils.itemContextMenu(element, "[data-context-menu=\"spell\"]", spells);
    // // INVENTORY
    // const consumables = ["consumable"].map((t) => actor.getItemsByType(t)).flat();
    // FoundryUtils.itemContextMenu(element, "[data-context-menu=\"inventory\"]", consumables);
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
  }
}
