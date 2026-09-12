import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";
import { AH_TableRenderer } from "../api/_module.mjs";

export class EngramTableRenderer extends AH_TableRenderer {

  getColumns() {
    return [
      TableColumns.name({
        header: "AH.COMMON.Name",
        perform: true,
        img: entry => entry.parent.parent.img,
        name: entry => entry.name,
        id: entry => entry.parent.parent.id,
        type: "engram",
        dataset: (entry) => {
          return {
            level: entry.schema.name,
          };
        },
      }),
      TableColumns.itemProperties({
        getData: (entry) => entry,
      }),
      TableColumns.itemCost({
        getData: (entry) => entry,
      }),
    ];
  }

  getKey(entry) {
    return entry.parent.parent.uuid;
  }
}
