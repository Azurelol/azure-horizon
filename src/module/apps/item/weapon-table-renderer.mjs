import AH from "../../config.mjs";
import { isActorType } from "../../constants.mjs";
import { AttackTableRenderer } from "./attack-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export default class WeaponTableRenderer extends AttackTableRenderer {

  /**
   * @returns {AH_TableColumnConfig[]}
   * @private
   */
  _getItemColumns() {
    let columns = super._getItemColumns();
    columns.push(TableColumns.textColumn({
      header: "AH.EQUIPMENT.Handedness",
      getText: entry => {
        return AH.handedness[entry.system?.handedness].short ?? "";
      },
    }));
    return columns;
  }

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
