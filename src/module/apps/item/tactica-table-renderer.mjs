
import ItemTableRenderer from "./item-table-renderer.mjs";
import TableColumns from "../api/table-columns.mjs";
import AH from "../../config.mjs";
import { localize } from "../../constants.mjs";

export class TacticaTableRenderer extends ItemTableRenderer {
  _getItemColumns() {
    return [
    ];
  }
}

export class TacticaWeaponTableRenderer extends TacticaTableRenderer {

  _getItemColumns() {
    return [
      TableColumns.textColumn({
        header: "AH.FIELD.Category",
        getText: (entry) => localize(AH.tactica.weapon.category[entry.system.data.category].label),
      }),
      TableColumns.textColumn({
        header: "AH.FIELD.Range",
        getText: (entry) => {
          const range = entry.system.data.range;
          return `${range.min}-${range.max}`;
        },
      }),
      // TableColumns.textColumn({
      //   header: "AH.FIELD.DamageType.long",
      //   getText: (entry) => {
      //     return localize(AH.damageTypes[entry.system.data.damage.type].label);
      //   },
      // }),
      TableColumns.textColumn({
        header: "AH.FIELD.Power",
        getText: (entry) => {
          const power = entry.system.data.damage.power;
          return power ? localize(AH.power[power].label) : "";
        },
      }),
      TableColumns.textColumn({
        header: "AH.FIELD.Weight",
        getText: (entry) => localize(AH.equipmentWeight[entry.system.data.weight].label),
      }),
    ];
  }
}
