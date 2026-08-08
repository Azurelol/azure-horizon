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
   * @param {AH_ActionType} actionType
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
    // // SPELLS
    // const spells = ["spell"].map((t) => actor.getItemsByType(t)).flat();
    // FoundryUtils.itemContextMenu(element, "[data-context-menu=\"spell\"]", spells);
    // // INVENTORY
    // const consumables = ["consumable"].map((t) => actor.getItemsByType(t)).flat();
    // FoundryUtils.itemContextMenu(element, "[data-context-menu=\"inventory\"]", consumables);
    // // SKILLS
    // /** @type {FUItem[]} **/
    // let skills = ["skill", "miscAbility"]
    //   .map((t) => actor.getItemsByType(t))
    //   .flat()
    //   .filter((s) => {
    //     return !s.system.passive;
    //   });
    // for (const fuid of ActionHandler.skillsWithApps) {
    //   const skill = actor.getItemsByFuid(fuid);
    //   if (skill) {
    //     skills.push(...skill);
    //   }
    // }
    // FoundryUtils.itemContextMenu(element, "[data-context-menu=\"skill\"]", skills);
  }
}
