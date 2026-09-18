import AH from "../../config.mjs";
import { isActorType } from "../../constants.mjs";
import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export default class ArmorTableRenderer extends ItemTableRenderer {

  _getItemColumns() {
    return [
      TableColumns.itemProperties(),
      TableColumns.textColumn({
        header: "AH.EQUIPMENT.Weight",
        getText: entry => {
          return AH.equipmentWeight[entry.system.weight] ?? "";
        },
      }),
    ];
  }

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
