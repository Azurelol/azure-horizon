
import TableColumns from "../api/table-columns.mjs";
import { DocumentTableRenderer } from "../api/_module.mjs";
import { StringUtils } from "../../utils/_module.mjs";
import AH from "../../config.mjs";

export class ActorTableRenderer extends DocumentTableRenderer {

  /**
   * @returns {AH_TableColumnConfig[]}
   * @private
   */
  _getActorPropertyColumns() {
    return [];
  }

  getColumns() {
    let columns = super.getColumns();
    columns.push(
      TableColumns.documentName({
        header: "AH.COMMON.Name",
        perform: false,
        type: "item",
      }));
    columns.push(...this._getActorPropertyColumns());
    return columns;
  }
}

export class AdversaryTableRenderer extends ActorTableRenderer {

  _getActorPropertyColumns() {
    return [
      TableColumns.textColumn({
        header: "AH.ADVERSARY.Rank",
        getText: (actor) => StringUtils.localize(AH.rank[actor.system.profile.rank]),
      }),
      TableColumns.textColumn({
        header: "AH.ADVERSARY.Role",
        getText: (actor) => StringUtils.localize(AH.role[actor.system.profile.role]),
      }),
    ];
  }
}

export class FollowerTableRenderer extends ActorTableRenderer {

  _getActorPropertyColumns() {
    return [
      TableColumns.textColumn({
        header: "AH.FOLLOWER.Kind",
        getText: (actor) => StringUtils.localize(AH.followerTypes[actor.system.profile.kind]),
      }),
    ];
  }
}
