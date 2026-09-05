import { AH_TableRenderer } from "../api/_module.mjs";
import TableColumns from "../api/table-columns.mjs";
import AH from "../../config.mjs";

export class ExperienceTableRenderer extends AH_TableRenderer {
  getKey(entry) {
    return entry.text;
  }

  getColumns() {
    return [
      TableColumns.textColumn({
        header: "AH.EXPERIENCE.Trigger",
        getText: (entry) => entry.text,
      }),
      TableColumns.textColumn({
        header: "AH.CHARACTER.ExperiencePoint.short",
        getText: (entry) => entry.amount,
      }),
      TableColumns.actions({
        header: "AH.COMMON.Actions",
        cssClass: "ah-table__column__actions",
        dataset: (entry) => {
          return {
            text: entry.text,
            amount: entry.amount,

          };
        },
        actions: [
          {
            action: "triggerExperience",
            tooltip: "AH.COMMON.Trigger",
            icon: AH.icons.add,
            keys: ["text", "amount"],
          },
        ],
      }),

    ];
  }
}
