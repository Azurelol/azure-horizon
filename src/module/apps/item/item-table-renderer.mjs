import { DocumentTableRenderer } from "./_module.mjs";
import TableColumns from "../api/table-columns.mjs";
import AH from "../../config.mjs";

const itemFields = Object.freeze({
  slug: "AH.ITEM.Slug",
  revision: "AH.ITEM.Revision",
});

export default class ItemTableRenderer extends DocumentTableRenderer {
  getColumns() {
    let columns = super.getColumns();
    columns.push(TableColumns.textColumn({
      header: "AH.COMMON.Description",
      getText: (item) => item.system.description,
    }));
    columns.push(TableColumns.actions(
      {
        header: "AH.COMMON.Actions",
        cssClass: "ah-table__column__actions",
        dataset: (entry) => {
          return {
            id: entry.id,
          };
        },
        actions: [
          {
            action: "sendItem",
            tooltip: "AH.COMMON.Send",
            icon: AH.icons.send,
            keys: ["id"],
          },
        ],
      },
    ));
    return columns;
  }
}
