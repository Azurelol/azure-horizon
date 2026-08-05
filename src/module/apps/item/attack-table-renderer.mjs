import ItemTableRenderer from './item-table-renderer.mjs';
import TableColumns from '../api/table-columns.mjs';

export default class AttackTableRenderer extends ItemTableRenderer {
  getColumns() {
    let columns = [];
    columns.push(
      TableColumns.documentName({
        header: "AH.COMMON.Name",
        perform: true,
        type: "item",
      }));
    columns.push(TableColumns.check());
    columns.push(TableColumns.damage());
    columns.push(this.getItemActions());
    return columns;
  }
}
