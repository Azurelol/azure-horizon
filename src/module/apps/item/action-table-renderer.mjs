import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export class ActionTableRenderer extends ItemTableRenderer {

  _getItemColumns() {
    return [
      TableColumns.itemProperties(),
      TableColumns.itemCost(),
    ];
  }
}
