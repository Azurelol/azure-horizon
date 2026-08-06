import AttackTableRenderer from "./attack-table-renderer.mjs";
import AH from "../../config.mjs";
import { isActorType } from "../../constants.mjs";
import ItemTableRenderer from "./item-table-renderer.mjs";

export default class ArmorTableRenderer extends ItemTableRenderer {

  _getItemActions() {
    return [
      {
        action: "equipItem",
        tooltip: "AH.COMMON.Equip",
        icon: (entry) => {
          if (isActorType(entry.parent)) {
            const hero = entry.parent;
            if (hero.system.equipment.has(entry)) {
              return AH.icons.unequip;
            }
          }
          return AH.icons.equip;
        },
        keys: ["id", "type"],
      },
    ];
  }
}
