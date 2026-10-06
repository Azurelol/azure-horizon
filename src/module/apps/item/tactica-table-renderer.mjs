
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

export class TacticaConsumableTableRenderer extends ItemTableRenderer {
  _getItemColumns() {
    return [
      TableColumns.textColumn({
        header: "AH.FIELD.Resource",
        getText: (entry) => {
          const resource = entry.system.data.resource;
          return resource.amount ? `${resource.amount} ${resource.type?.toUpperCase()}` : "";
        },
      }),
      TableColumns.textColumn({
        header: "AH.FIELD.Cost",
        getText: (entry) => {
          const cost = entry.system.data.cost;
          return cost.amount ? `${cost.amount} ${cost.resource?.toUpperCase()}` : "";
        },
      }),
    ];
  }
}

export class TacticaClassTableRenderer extends ItemTableRenderer {
  _getItemColumns() {
    return [
      TableColumns.textColumn({
        header: "AH.FIELD.Tier",
        getText: (entry) => entry.system.data.tier,
      }),
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
