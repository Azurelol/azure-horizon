import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";
import { StringUtils } from "../../utils/_module.mjs";

export class ClassTableRenderer extends ItemTableRenderer {
  _getItemColumns() {
    return [
      TableColumns.textColumn({
        header: "AH.FIELD.Traits",
        getText: (entry) => Array.from(entry.system.traits).map(t => StringUtils.capitalize(t)).join(", "),
      }),
    ];
  }
}

export class SkillTableRenderer extends ItemTableRenderer {

  #renderClass = true;

  /**
   * @returns {SkillTableRenderer}
   */
  withoutClassColumn() {
    this.#renderClass = false;
    return this;
  }

  _getItemColumns() {
    let columns = [];
    if (this.#renderClass) {
      TableColumns.textColumn({
        header: "AH.FIELD.Class",
        getText: (entry) => StringUtils.capitalize(entry.system.class),
      });
    }

    columns.push(TableColumns.textColumn({
      header: "AH.CHARACTER.SkillLevel.short",
      tooltip: "AH.CHARACTER.SkillLevel.long",
      getText: (entry) => StringUtils.capitalize(entry.system.level.max),
    }));
    columns.push(TableColumns.itemProperties());
    return columns;
  }
}

export class ClassFeatureTableRenderer extends ItemTableRenderer {
  _getItemColumns() {
    return [
      TableColumns.textColumn({
        header: "AH.FIELD.Class",
        getText: (entry) => StringUtils.capitalize(entry.system.class),
      }),
    ];
  }
}
