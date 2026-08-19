
import TableColumns from "../api/table-columns.mjs";
import { DocumentTableRenderer } from "../api/_module.mjs";

export class ActorTableRenderer extends DocumentTableRenderer {

  /**
   * @returns {AH_TableColumnConfig[]}
   * @private
   */
  _getActorProperties() {
    return [];
  }

  getColumns() {
    let columns = super.getColumns();
    columns.push(
      TableColumns.documentName({
        header: "AH.COMMON.Name",
        perform: true,
        type: "item",
      }));
    columns.push(...this._getActorProperties());
    return columns;
  }
}

export class AdversaryTableRenderer extends ActorTableRenderer {
}
