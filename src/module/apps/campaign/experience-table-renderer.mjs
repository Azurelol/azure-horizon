import { AH_TableRenderer } from "../api/_module.mjs";
import TableColumns from "../api/table-columns.mjs";

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
    ];
  }
}
