import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";
import { StringUtils } from "../../utils/_module.mjs";

export class ClassTableRenderer extends ItemTableRenderer {
  _getItemProperties() {
    return [
      TableColumns.textColumn({
        header: "AH.FIELD.Traits",
        getText: (entry) => Array.from(entry.system.traits).map(t => StringUtils.capitalize(t)).join(", "),
      }),
    ];
  }
}

export class SkillTableRenderer extends ItemTableRenderer {
  _getItemProperties() {
    return [
      TableColumns.textColumn({
        header: "AH.FIELD.Class",
        getText: (entry) => StringUtils.capitalize(entry.system.class),
      }),
      TableColumns.itemProperties(),
    ];
  }
}

export class ClassFeatureTableRenderer extends ItemTableRenderer {
  _getItemProperties() {
    return [
      TableColumns.textColumn({
        header: "AH.FIELD.Class",
        getText: (entry) => StringUtils.capitalize(entry.system.class),
      }),
    ];
  }
}
