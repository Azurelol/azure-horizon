import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";
import AH from "../../config.mjs";

export class AttackTableRenderer extends ItemTableRenderer {

  _getItemColumns() {
    return [
      TableColumns.itemProperties(),
    ];
  }
}

export class AbilityTableRenderer extends ItemTableRenderer {

  _getItemColumns() {
    return [
      TableColumns.itemProperties(),
      TableColumns.textColumn({
        header: "AH.ADVERSARY.Intent.long",
        getText: entry => {
          const intent = AH.intents[entry.system.intent];
          if (intent) {
            return intent.label;
          }
          return "";
        },
      }),
    ];
  }
}
