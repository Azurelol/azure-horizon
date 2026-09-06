import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export default class EquipmentTableRenderer extends ItemTableRenderer {
  _getItemColumns() {
    return [
      TableColumns.itemProperties(),
    ];
  }

  previewActions() {
    return true;
  }
}
