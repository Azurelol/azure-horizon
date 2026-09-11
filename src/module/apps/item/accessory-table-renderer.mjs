import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export default class AccessoryTableRenderer extends ItemTableRenderer {

  _getItemActions() {
    return [ ];
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
