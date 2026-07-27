import { renderTemplate } from "../../constants.mjs";
import { StringUtils } from "../../utils/_module.mjs";

/**
 * @typedef AH_DocumentNameColumnOptions
 * @template {Object} T
 * @property {string, (() => string)} header
 * @property {number} [headerSpan]
 * @property {(T) => string|Promise<string>} [renderCaption]
 * @property {string, ((T) => string)} cssClass
 * @property {Boolean} perform Whether the document can perform an action
 * @property {String} type The document type
 */

/**
 * @template {Object} T
 * @param {AH_DocumentNameColumnOptions} options
 * @return {AH_TableColumnConfig<T>}
 */
function documentName(options) {
  return {
    headerAlignment: "start",
    headerSpan: options.headerSpan,
    cssClass: "ah-table__column__primary",
    renderHeader: options.header instanceof Function ? options.header : () => StringUtils.localize(options.header || "AH.COMMON.Name"),
    renderCell: async(entry) => {
      return renderTemplate("components/table/table-column-document-name", {
        name: entry.name,
        img: entry.img,
        id: entry.id,
        pack: entry.pack,
        uuid: entry.uuid,
        type: options.type ?? entry.type,
        perform: options.perform,
      });
    },
  };
}

/**
 * @typedef AH_TextColumnOptions
 * @template {Object} T
 * @property {string} header
 * @property {string} [cssClass]
 * @property {"start", "center", "end"} [alignment="center"]
 * @property {"low", "normal", "high"} [importance="normal"]
 * @property {(T) => string|number|Promise<string|number>} getText result will be translated
 * @property {string|((T) => string|number|Promise<string|number>)} [tooltip]
 */

/**
 * @template {Object} T
 * @param {AH_TextColumnOptions} [options]
 * @return {AH_TableColumnConfig<T>}
 */
function textColumn(options = {}) {
  return {
    hideHeader: !options.header,
    renderHeader: () => StringUtils.localize(options.header),
    headerAlignment: options.alignment,

    renderCell: async (entry) => {
      return renderTemplate("components/table/table-column-text", {
        text: "" + (await options.getText(entry)),
        cssClass: options.cssClass,
      });
    },
  };
}

/**
 * @typedef AH_TableAction
 * @template {Object} T
 * @property {String} action
 * @property {String} label
 * @property {String} tooltip
 * @property {String} icon
 * @property {(T) => Record<string, string>} keys
 */

/**
 * @typedef AH_ActionColumnOptions
 * @template {Object} T
 * @property {string} header
 * @property {string} [cssClass]
 * @property {(T) => Record<string, string>} dataset
 * @property {AH_TableAction[]} actions
 */

/**
 * @template {Object} T
 * @param {AH_ActionColumnOptions} options
 * @returns {AH_TableColumnConfig<T>}
 */
function actions(options = {}) {
  return {
    hideHeader: !options.header,
    renderHeader: () => StringUtils.localize(options.header),
    cssClass: options.cssClass,
    renderCell: async (entry) => {
      return renderTemplate("components/table/table-column-actions", {
        dataset: options.dataset instanceof Function ? options.dataset(entry) : options.dataset,
        actions: options.actions,
      });
    },
  };
}

const TableColumns = Object.freeze({
  documentName,
  textColumn,
  actions,
});

export default TableColumns;
