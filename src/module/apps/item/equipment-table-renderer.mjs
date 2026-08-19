import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export default class EquipmentTableRenderer extends ItemTableRenderer {
  _getItemProperties() {
    return [
      TableColumns.itemProperties(),
    ];
  }
}
