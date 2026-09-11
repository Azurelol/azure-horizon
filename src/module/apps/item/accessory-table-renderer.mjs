import AH from "../../config.mjs";
import { isActorType } from "../../constants.mjs";
import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export default class AccessoryTableRenderer extends ItemTableRenderer {

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

  _getItemColumns() {
    let columns = super._getItemColumns();
    columns.push(TableColumns.engrams({
      header: "AH.ITEM.Engram.plural",
    }));
    return columns;
  }

  get previewActions() {
    return false;
  }
}
