import { AH_TableRenderer } from "../api/_module.mjs";
import TableColumns from "../api/table-columns.mjs";

/**
 * @template {Document} T
 */
export default class DocumentTableRenderer extends AH_TableRenderer {
  getKey(entry) {
    return entry.uuid;
  }

  getColumns() {
    return [
      TableColumns.documentName({
        header: "AH.COMMON.Name",
      }),
    ];
  }
}
