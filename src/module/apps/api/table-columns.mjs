import { enrichHTML, renderTemplate, systemTemplatePath } from '../../constants.mjs';
import { StringUtils } from '../../utils/_module.mjs';

const TEMPLATES = Object.freeze({
  documentName: systemTemplatePath("components/table/table-column-document-name"),
  text: systemTemplatePath("components/table/table-column-text"),
  actions: systemTemplatePath("components/table/table-column-actions"),
  check: systemTemplatePath("components/table/table-column-check"),
  damage: systemTemplatePath("components/table/table-column-damage"),
})

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
      return renderTemplate(TEMPLATES.documentName, {
        name: entry.name,
        img: entry.img,
        id: entry.id,
        pack: entry.pack,
        uuid: entry.uuid,
        type: options.type ?? entry.type,
        perform: options.perform,
      }, false);
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
      let text = "" + (await options.getText(entry));
      text = await enrichHTML(text);
      return renderTemplate(TEMPLATES.text, {
        text: text,
        cssClass: options.cssClass,
      }, false);
    },
  };
}

/**
 * @typedef AH_ItemColumnOptions
 * @template {Object} T
 * @property {string} header
 * @property {string} [cssClass]

/**
 * @template {Object} T
 * @param {AH_TextColumnOptions} [options]
 * @return {AH_TableColumnConfig<T>}
 */
function damage(options = {}) {
  return {
    hideHeader: !options.header,
    renderHeader: () => StringUtils.localize(options.header ?? "AH.COMMON.Damage"),
    headerAlignment: options.alignment,

    renderCell: async (entry) => {
      /** @type DamageDataModel **/
      const damage = entry.system.damage;
      if (!damage) {
        return "";
      }
      return renderTemplate(TEMPLATES.damage, {
        damage,
        cssClass: options.cssClass,
      }, false);
    },
  };
}

/**
 * @template {Object} T
 * @param {AH_TextColumnOptions} [options]
 * @return {AH_TableColumnConfig<T>}
 */
function check(options = {}) {
  return {
    hideHeader: !options.header,
    renderHeader: () => StringUtils.localize(options.header ?? "AH.COMMON.Check"),
    headerAlignment: options.alignment,

    renderCell: async (entry) => {
      /** @type CheckDataModel **/
      const check = entry.system.check;
      if (!check) {
        return "";
      }
      return renderTemplate(TEMPLATES.check, {
        check,
        cssClass: options.cssClass,
      }, false);
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
      return renderTemplate(TEMPLATES.actions, {
        dataset: options.dataset instanceof Function ? options.dataset(entry) : options.dataset,
        actions: options.actions,
      }, false);
    },
  };
}

const TableColumns = Object.freeze({
  documentName,
  textColumn,
  actions,

  damage,
  check,

  TEMPLATES
});

export default TableColumns;
