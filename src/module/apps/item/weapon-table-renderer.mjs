import AttackTableRenderer from "./attack-table-renderer.mjs";
import AH from "../../config.mjs";
import { isActorType } from "../../constants.mjs";

export default class WeaponTableRenderer extends AttackTableRenderer {

  _getItemActions() {
    return [
      {
        action: "equipItem",
        tooltip: "AH.ACTION.Swap",
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
