import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export default class EquipmentTableRenderer extends ItemTableRenderer {

  /**
   * @override
   */
  getColumns() {
    let columns = super.getColumns();
    columns.push(TableColumns.textColumn({
      header: "AH.COMMON.Description",
      getText: (item) => item.system.description,
    }));
    return columns;
  }
}
