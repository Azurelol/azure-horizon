
import TableColumns from "../api/table-columns.mjs";
import AH from "../../config.mjs";
import { DocumentTableRenderer } from "./_module.mjs";

export default class ItemTableRenderer extends DocumentTableRenderer {

  /**
   * @returns {AH_TableAction[]}
   * @private
   */
  _getItemActions() {
    return [];
  }

  /**
   * @returns {AH_TableColumnConfig[]}
   * @private
   */
  _getItemColumns() {
    return [];
  }

  /**
   * @returns {boolean} Whether actions should be shown in preview mode.
   * @virtual
   */
  get previewActions() {
    return false;
  }

  static TABLE_CONTEXT_MENU_CLASS = "item-table-context-menu";

  *contextMenus(application) {
    yield* super.contextMenus();
    yield {
      className: `.${ItemTableRenderer.TABLE_CONTEXT_MENU_CLASS}`,
      eventName: "click",
      entries: [
        {
          action: "sendItem",
          name: "AH.COMMON.Send",
          icon: AH.icons.send,
          keys: ["id", "type"],
          callback: (target, event) => {
            return application.constructor._sendItem?.call(application, event, target);
          },
        },
        {
          action: "editDocument",
          name: "AH.COMMON.Edit",
          icon: AH.icons.edit,
          keys: ["id", "type"],
          callback: (target, event) => {
            return application.constructor._editDocument?.call(application, event, target);
          },
        },
        {
          action: "deleteDocument",
          name: "AH.COMMON.Remove",
          icon: AH.icons.remove,
          keys: ["id", "type"],
          callback: (target, event) => {
            return application.constructor._deleteDocument?.call(application, event, target);
          },
        },
        ...this._getItemActions(),
      ],
    };
  }

  /**
   * @returns {AH_TableColumnConfig}}
   * @private
   */
  _getCommonActionOptions() {
    return TableColumns.contextMenu({
      header: "",
      cssClass: ItemTableRenderer.TABLE_CONTEXT_MENU_CLASS,
      preview: this.previewActions,
      dataset: (entry) => {
        return {
          type: "Item",
        };
      },
    });
  }

  getColumns() {
    let columns = super.getColumns();
    columns.push(
      TableColumns.documentName({
        header: "AH.COMMON.Name",
        perform: !this.config.preview,
        type: "item",
      }));
    columns.push(...this._getItemColumns());
    columns.push(TableColumns.itemTraits());
    columns.push(this._getCommonActionOptions());
    return columns;
  }
}
