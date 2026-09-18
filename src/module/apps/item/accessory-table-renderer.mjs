import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export class AccessoryTableRenderer extends ItemTableRenderer {

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

export class EngramTableRenderer extends ItemTableRenderer {

  _getItemActions() {
    return [ ];
  }

  _getItemColumns() {
    let columns = super._getItemColumns();

    return columns;
  }

  get previewActions() {
    return false;
  }
}
