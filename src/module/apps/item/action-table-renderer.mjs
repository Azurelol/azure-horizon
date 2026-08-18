import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export default class ActionTableRenderer extends ItemTableRenderer {

  _getItemProperties() {
    return [
      TableColumns.itemProperties(),
      TableColumns.itemCost(),
    ];
  }
}
