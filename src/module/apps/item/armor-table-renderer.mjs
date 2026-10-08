import AH from "../../config.mjs";
import { isActorType } from "../../constants.mjs";
import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export default class ArmorTableRenderer extends ItemTableRenderer {

  _getItemColumns() {
    return [
      TableColumns.customProperties({
        preview: true,
        getProperties: entry => [
          {
            label: "AH.CHARACTER.Defense.short",
            icon: "def",
            value: entry.system.def,
          },
          {
            label: "AH.CHARACTER.MagicDefense.short",
            icon: "mdef",
            value: entry.system.mdef,
          },
          {
            label: "AH.CHARACTER.Initiative.short",
            icon: "init",
            value: entry.system.init,
          },
        ],
      }),
    ];
  }
}
