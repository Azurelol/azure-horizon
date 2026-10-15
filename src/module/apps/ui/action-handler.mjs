import { FoundryUtils, HTMLUtils } from "../../utils/_module.mjs";
import { WeaponResolver } from "../../helpers/weapon-resolver.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import Actions from "../../pipelines/actions.mjs";
import { CheckPrompt } from "../../helpers/check-prompt.mjs";
import AH from "../../config.mjs";

/**
 * @typedef AH_CharacterAction
 * @property id
 * @property img
 * @property label
 * @property tooltip
 * @property type The type of character.
 * @property {(AHActor) => Boolean} condition
 * @property {(KeyboardModifiers) => Promise<Boolean>} perform An item action.
 */

/**
 * @typedef ActorActionGroup
 * @property id
 * @property icon
 * @property label
 * @property {Boolean} open
 * @property {AH_CharacterAction[]} actions Doesn't include the onClick/onContext
 */

/**
 * @typedef TokenActionData
 * @property id
 * @property name
 * @property img
 * @property tooltip
 * @property onClick
 * @property onContext
 * @property {Number} ap
 */

/**
 * @typedef TokenActionMap
 * @property {String} actorId
 * @property {String} name
 * @property {String, ActorActionGroup[]} groups
 * @property {TokenActionData[]} actions
 */

/**
 * @typedef AH_ActorActionMenu
 * @property {String} id
 * @property {String} label
 * @property {String} tooltip
 * @property {String} icon
 * @property {AH_ItemType[]} items The item types that automatically map to this menu.
 * @property {(AHActor) => AHItem[]} getItems An optional function to get items from non-standard sources.
 * @property {(AHItem) => Boolean} filter Used to filter entries.
 * @property {AH_ActorType[]} actors
 * @property {(AHActor) => AH_CharacterAction[]} getActions Generated actions for this menu.
 */

/**
 * @type {AH_ActorActionMenu[]}
 */
const ACTION_MENUS = [
  {
    id: "attack",
    label: "AH.ACTION.Attack",
    tooltip: "AH.ACTION.AttackHint",
    actors: ["hero", "adversary"],
    items: ["attack", "weapon"],
  },
  {
    id: "skill",
    label: "AH.ACTION.Skill",
    tooltip: "AH.ACTION.SkillHint",
    actors: ["hero", "adversary"],
    items: ["skill", "classFeature", "ability"],
    filter: (item) => {
      return item.system.action?.enabled;
    },
  },
  {
    id: "spell",
    label: "AH.ACTION.Spell",
    tooltip: "AH.ACTION.SpellHint",
    actors: ["hero"],
    items: ["spell"],
    getItems: (actor) => {
      return actor.system.equipment.getEngramsOfKind();
    },
  },
  {
    id: "item",
    label: "AH.ACTION.Item",
    tooltip: "AH.ACTION.ItemHint",
    actors: ["hero"],
    items: ["consumable"],
  },

  {
    id: "maneuver",
    label: "AH.ACTION.Maneuver",
    tooltip: "AH.ACTION.ManeuverHint",
    actors: ["hero", "adversary"],
    getActions: (actor) => [
      {
        id: "defend",
        name: "AH.ACTION.Defend",
        ap: 1,
        icon: "ah-icon-defend",
        perform: async () => {
          const block = Formulas.calculateBlock(actor.system);
          return Actions.perform(actor, null, (config) => {
            config.setLabel("AH.ACTION.Defend");
            config.addActionCost(1);
            config.setResource("hp", block.hp, true);
            if (block.tp) {
              config.addTraits("stress");
            }
          });
        },
      },
      {
        id: "recover",
        name: "AH.ACTION.Recover",
        ap: 1,
        icon: "ah-icon-recover",
        condition: (actor) => {
          return actor.type === "hero";
        },
        perform: async () => {
          const recovery = Formulas.calculateRecovery(actor.system);
          Actions.perform(actor, null, (config) => {
            config.setLabel("AH.ACTION.Recover");
            config.addActionCost(1);
            config.setResource("hp", recovery.hp);
            if (recovery.mp) {
              config.addExpense({
                source: "skill",
                resource: "mp",
                amount: recovery.mp,
              });
            }
            if (actor.type === "hero") {
              config.addTraits("stress");
            }
          });
        },
      },
    ],
  },

  {
    id: "checks",
    label: "AH.ACTION.Check",
    tooltip: "AH.ACTION.CheckHint",
    actors: ["hero"],
    getActions: (actor) => [
      {
        id: "attributeCheck",
        name: "AH.CHECK.Attribute",
        icon: "ah-icon-check-attribute",
        perform: async () => {
          await CheckPrompt.attributeCheck(actor);
        },
      },
      {
        id: "ritualCheck",
        name: "AH.CHECK.Ritual",
        icon: "ah-icon-check-ritual",
        perform: async () => {
          await CheckPrompt.ritualCheck(actor, undefined, {
            initialConfig: {
              primary: "ins",
              secondary: "wlp",
            },
          });
        },
      },
    ],
  },

  {
    id: "rest",
    label: "AH.ACTION.Rest",
    actors: ["hero"],
    tooltip: "AH.ACTION.RestHint",
    getActions: (actor) => [
      {
        id: "longRest",
        name: "AH.INTERVAL.LongRest.long",
        icon: AH.icons.longRest,
        perform: async () => {
          return actor.rest("long");
        },
      },
      {
        id: "shortRest",
        name: "AH.INTERVAL.ShortRest.long",
        icon: AH.icons.shortRest,
        perform: async () => {
          return actor.rest("short");
        },
      },
      {
        id: "resupply",
        name: "AH.INTERVAL.Resupply.long",
        icon: AH.icons.resupply,
        perform: async () => {
          return actor.rest("resupply");
        },
      },
    ],
  },

  {
    id: "setup",
    icon: "rest",
    label: "AH.ACTION.Setup",
    actors: ["adversary"],
    tooltip: "AH.ACTION.SetupHint",
    getActions: (actor) => [
      {
        id: "reset",
        name: "AH.COMMON.Reset",
        icon: AH.icons.longRest,
        perform: async () => {
          return actor.rest("long");
        },
      },
    ],
  },
];

/**
 * @param {AHItem} item
 * @param {Event} event
 */
async function useItem(item, event) {
  if (item.perform) {
    const modifiers = HTMLUtils.getKeyboardModifiers(event);
    return item.perform(modifiers);
  }
  return item.sheet.render({ force: true });
}

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

  // TODO: Will be used with an @ACTION text enricher
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
   * @returns {AH_ActorActionMenu[]}
   */
  getMenuActions() {
    return ACTION_MENUS.filter(m => {
      return !(m.actors && m.actors.find(at => at === this.actor.type) === undefined);
    });
  }

  /**
   * @param {Object} options
   * @param options.openGroups
   * @return {TokenActionMap}
   */
  getTokenActions({ openGroups = new Set() } = {}) {
    if (!this.actor) return null;

    /** @type {Map<string, TokenActionData>} action id -> action, for click lookup */
    const actions = new Map();
    /** @type {ActorActionGroup[]} **/
    const groups = [];

    const pushGroup = (id, label, list) => {
      if (!list.length) return;
      for (const action of list) {
        actions.set(action.id, action);
      }
      groups.push({
        id,
        label,
        open: openGroups.has(id),
        // Filter only display data here, rest is on the top-level actions array
        actions: list.map(({ id, name, img, icon, tooltip, ap }) => ({ id, name, img, tooltip, icon, ap })),
      });
    };

    /** @returns {TokenActionData} **/
    const itemAction = item => {
      const ap = item.ap ?? item.system?.ap;
      return ({
        id: `item.${item.id}`,
        name: item.name,
        img: item.img,
        icon: item.icon,
        tooltip: item.name,
        ap: ap,
        onClick: (event) => {
          if (item.perform) {
            const modifiers = HTMLUtils.getKeyboardModifiers(event);
            return item.perform(modifiers);
          }
          return item.sheet?.render({ force: true });
        },
        onContext: () => item.sheet.render({ force: true }),
      });
    };

    // Items claimed by an explicit group definition.
    const claimed = new Set();
    for (const menu of ACTION_MENUS) {
      if (menu.actors && menu.actors.find(a => a === this.actor.type) === undefined) {
        continue;
      }
      const items = this.#getMenuActions(menu);
      if (items && items.length) {
        const tokenActions = items.map(i => itemAction(i));
        tokenActions.forEach(i => { claimed.add(i.id);});
        pushGroup(menu.id, menu.label, tokenActions);
      }
    }

    // TODO: How to...
    // Utility group: things that are about the token, not an item.
    const token = this.actor.token ?? this.actor.getActiveTokens()[0]?.document;
    const utility = [{
      id: "token",
      name: "Open Sheet",
      img: null,
      tooltip: "Open Character Sheet",
      onClick: () => this.actor.sheet.render({ force: true }),
    }];
    if (token && game.combat) {
      utility.push({
        id: "token.combat",
        name: token.inCombat ? "Leave Combat" : "Join Combat",
        img: null,
        tooltip: token.inCombat ? "Remove from combat" : "Add to combat",
        onClick: () => token.toggleCombatant(),
      });
    }
    pushGroup("token", "AH.COMMON.Token", utility);
    return {
      actorId: this.actor.id,
      name: this.actor.name,
      groups,
      actions,
    };
  }

  /**
   * @param {HTMLElement} element
   */
  setupMenu(element) {
    for (const menu of ACTION_MENUS) {
      if (menu.actors && menu.actors.find(a => a === this.actor.type) === undefined) {
        continue;
      }
      let items = this.#getMenuActions(menu);
      if (items.length > 0) {
        FoundryUtils.itemContextMenu(element, `[data-context-menu='${menu.id}']`, items, undefined, true);
      }
    }
  }

  /**
   * @param {AH_ActorActionMenu}  menu
   * @returns {AH_CharacterAction[]}
   */
  #getMenuActions(menu) {
    let items = [];
    if (menu.items) {
      let matchingItems = this.actor.getItemsByType(...menu.items);
      if (menu.filter) {
        matchingItems = matchingItems.filter(menu.filter);
      }
      items.push(...matchingItems);
    }
    if (menu.getItems) {
      const extraItems = menu.getItems(this.actor);
      if (extraItems) {
        items.push(...extraItems);
      }
    }
    if (menu.getActions) {
      items.push(...menu.getActions(this.actor));
    }
    return items;
  }

  // /**
  //  * @param {HTMLElement} element
  //  */
  // setupMenuV1(element) {
  //   // ATTACKS
  //   const attacks = WeaponResolver.getEquippedWeapons(this.actor);
  //   FoundryUtils.itemContextMenu(element, "[data-context-menu=\"attack\"]", attacks, undefined, true);
  //   // SPELLS
  //   const spells = ["spell"].map((t) => this.actor.getItemsByType(t)).flat();
  //   if (this.actor.type === "hero") {
  //     const magicEngrams = this.actor.system.equipment.getEngramsOfKind();
  //     spells.push(...magicEngrams);
  //   }
  //   FoundryUtils.itemContextMenu(element, "[data-context-menu=\"spell\"]", spells);
  //   // INVENTORY
  //   const consumables = this.actor.getItemsByType("consumable");
  //   FoundryUtils.itemContextMenu(element, "[data-context-menu=\"item\"]", consumables);
  //   if (this.actor.type === "hero") {
  //     // SKILLS
  //     /** @type {AHItem[]} **/
  //     let skills = ["skill"]
  //       .map((t) => this.actor.getItemsByType(t))
  //       .flat()
  //       .filter((s) => {
  //         return s.system.action.type === "action";
  //       });
  //     FoundryUtils.itemContextMenu(element, "[data-context-menu=\"skill\"]", skills);
  //   }
  //   else if (this.actor.type === "adversary") {
  //     // ABILITIES
  //     let abilities = this.actor.getItemsByType("ability").filter(a => a.system.action.type === "action");
  //     FoundryUtils.itemContextMenu(element, "[data-context-menu=\"ability\"]", abilities);
  //   }
  //   // MANEUVER
  //   FoundryUtils.itemContextMenu(element, "[data-context-menu=\"maneuver\"]", this.getManeuvers(), undefined);
  //   // CHECKS
  //   FoundryUtils.itemContextMenu(element, "[data-context-menu=\"check\"]", this.getChecks(), undefined);
  //   // REST
  //   FoundryUtils.itemContextMenu(element, "[data-context-menu=\"rest\"]", this.getRestActions(), undefined);
  // }

  /**
   * @param {HTMLElement} element
   */
  setupEquipment(element) {
    if (this.actor.type === "hero") {
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
    }
    else if (this.actor.type === "unit") {
      const weapons = this.actor.getItemsByType("tactica").filter(a => a.system.data.type === "tacticaWeapon");
      FoundryUtils.itemContextMenu(element, "[data-slot=\"weapon\"]", weapons, async item => {
        this.actor.system.equipItem(item, "weapon");
      });
    }
  }

  /**
   * @param {HTMLElement} element
   */
  setupAttacks(element) {
    // ATTACK TOGGLE
    const attacks = WeaponResolver.getEquippedWeapons(this.actor);
    FoundryUtils.itemContextMenu(element, "[data-slot=\"attack\"]", attacks, async item => {
      this.actor.system.setAttack(item);
    });
  }

  /**
   * @param {HTMLElement} element
   */
  setupEngrams(element) {
    const engrams = this.actor.getItemsByType("engram");
    FoundryUtils.itemContextMenu(element, "[data-slot=\"engram\"]", engrams, async (item, dataset) => {
      const { itemId, index } = dataset;
      const accessory = this.actor.items.get(itemId);
      if (accessory) {
        await this.actor.system.equipment.toggleEngram(accessory, item, Number(index));
      }
    });
  }
}
