import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";

export default class AttackTableRenderer extends ItemTableRenderer {

  _getItemProperties() {
    return [
      TableColumns.check(),
      TableColumns.damage(),
    ];
  }
}
