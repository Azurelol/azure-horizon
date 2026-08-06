import AttackTableRenderer from "./attack-table-renderer.mjs";
import AH from "../../config.mjs";
import { isActorType } from "../../constants.mjs";

export default class WeaponTableRenderer extends AttackTableRenderer {

  _getItemActions() {
    return [
      {
        action: "equipItem",
        tooltip: "AH.COMMON.Equip",
        icon: (entry) => {
          if (isActorType(entry)) {
            if (entry.system.equipment.has(entry)) {
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
