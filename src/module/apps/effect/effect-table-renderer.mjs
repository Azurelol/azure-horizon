import { DocumentTableRenderer } from "../api/_module.mjs";
import TableColumns from "../api/table-columns.mjs";
import AH from "../../config.mjs";

// TODO: Needed?
export class EffectTableRenderer extends DocumentTableRenderer {
  getColumns() {
    let columns = super.getColumns();
    columns.push(
      TableColumns.documentName({
        header: "AH.COMMON.Name",
        perform: true,
        type: "effect",
      }));
    columns.push(TableColumns.actions(
      {
        header: "AH.COMMON.Actions",
        cssClass: "ah-table__column__actions",
        dataset: (entry) => {
          return {
            id: entry.id,
            type: "ActiveEffect",
          };
        },
        actions: [
          {
            action: "toggleEffect",
            tooltip: "AH.Effect.Toggle",
            icon: AH.icons.send,
            keys: ["id"],
          },
          {
            action: "editDocument",
            tooltip: "AH.COMMON.Edit",
            icon: AH.icons.edit,
            keys: ["id", "type"],
          },
        ],
      },
    ));
    return columns;
  }
}
