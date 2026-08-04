import { AH_TableRenderer } from "./_module.mjs";
import TableColumns from "./table-columns.mjs";

/**
 * @template {Document} T
 */
export default class DocumentTableRenderer extends AH_TableRenderer {
  getKey(entry) {
    return entry.uuid;
  }

  getColumns() {
    return [
    ];
  }
}
