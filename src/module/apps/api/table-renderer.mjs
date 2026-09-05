import { renderTemplate } from "../../constants.mjs";

/**
 * @template T
 * @typedef {string|((item: T) => string|Promise<string>)} AH_Render
 */

/**
 * @typedef AH_TableAction
 * @property label
 * @property icon
 * @property action
 */

/**
 * @typedef AH_TableConfig
 * @template {Object} T
 * @property {String} id An unique identifier to the table.
 * @property {String} title Optional caption for the table.
 * @property {ChatAction[]} actions Optional action buttons to display for the table.
 * @property {DragDropConfiguration[]} [dragDrop]
 * @property {String} tableClass
 * @property {String} rowClass
 * @property {(T) => string | number} getKey
 * @property {(T) => Boolean} isVisible
 * @property {Boolean} preview Whether the table is set to preview-mode
 * @property {Boolean} hideIfEmpty
 * @property {Record<string, Object>} data Additional top-level data that can be reused throughout cells.
 */

/**
 * @typedef AH_TableColumnConfig
 * @template {Object} T
 * @property {AH_Render<T>} renderHeader
 * @property {AH_Render<T>} renderCell
 * @property {Boolean} preview Whether this column can be rendered in preview mode.
 * @property {String} cssClass
 */

/**
 * @typedef AH_TableColumnHeader
 * @property {String} text
 */

/**
 * @typedef AH_TableCell
 * @template {Object} T
 * @property {String} html
 */

/**
 * @typedef AH_TableRow
 * @template {Object} T
 * @property {String} key
 * @property {Boolean} visible
 * @property {AH_TableCell<T>[]} cells
 */

/**
 * Base class for rendering tables of documents such as Items.
 * @template T
 */
export default class AH_TableRenderer {

  /**
   * @type AH_TableConfig
   */
  static TABLE_CONFIG = {};

  /** @type {foundry.applications.api.Application} */
  #application;

  /**
   * @return {foundry.applications.api.Application}
   */
  get application() {
    return this.#application;
  }

  /**
   * @type {AH_TableConfig}
   */
  #config;

  /**
   * @return {AH_TableConfig}
   */
  get config() {
    return this.#config;
  }

  /**
   * @returns {String} Unique identifier for the table.
   */
  get id() {
    return this.#config.id;
  }

  #clickHandler = this.#onClick.bind(this);

  /**
   * @param {AH_TableConfig} overrides
   */
  constructor(overrides = {}) {

    const configurations = [];
    let cls = this.constructor;
    while (cls !== AH_TableRenderer) {
      if (Object.hasOwn(cls, "TABLE_CONFIG")) configurations.unshift(cls.TABLE_CONFIG);
      cls = Object.getPrototypeOf(cls);
    }

    const _config = {};
    configurations.forEach((configuration) => foundry.utils.mergeObject(_config, foundry.utils.deepClone(configuration), { performDeletions: true }));
    Object.assign(_config, overrides);
    if (!_config.id) {
      _config.id = foundry.utils.randomID();
    }

    _config.dragDrop = (_config.dragDrop ?? []).map((dragDropConfig) => {
      dragDropConfig.permissions ??= {};
      for (let key in dragDropConfig.permissions) {
        dragDropConfig.permissions[key] = dragDropConfig.permissions[key].bind(this);
      }

      dragDropConfig.callbacks ??= {};
      for (let key in dragDropConfig.callbacks) {
        dragDropConfig.callbacks[key] = dragDropConfig.callbacks[key].bind(this);
      }

      return new foundry.applications.ux.DragDrop.implementation(dragDropConfig);
    });

    this.#config = foundry.utils.deepFreeze(_config);
  }

  /**
   * @param {foundry.applications.api.Application} application
   */
  attachListeners(application) {
    this.#application = application;

    const renderHookId = Hooks.on("renderApplicationV2", (application, element) => {
      if (application === this.application) {
        const tables = element.querySelectorAll(`.ah-table[data-table-id="${this.id}"]`);
        tables.forEach((table) => {
          table.addEventListener("click", this.#clickHandler);
          table.addEventListener("contextmenu", this.#clickHandler);
          this.config.dragDrop.forEach((dragDrop) => dragDrop.bind(table));
        });
      }
    });

    const closeHookId = Hooks.on("closeApplicationV2", (application) => {
      if (application === this.application) {
        Hooks.off("renderApplicationV2", renderHookId);
        Hooks.off("closeApplicationV2", closeHookId);
      }
    });
  }

  #onClick(event) {
    const table = event.target.closest(`[data-table-id="${this.id}"]`);
    if (table) {
    }
  }

  /**
   * @typedef AH_TableRenderOptions
   */

  /**
   * @param {Object[]} entries
   * @param {AH_TableRenderOptions}  options
   * @return {Promise<string>} A templated HTML string.
   */
  async render(entries, options = {}) {

    const config = this.#config;

    /**
     * @type {AH_TableColumnConfig[]}
     */
    const columns = this.getColumns().filter(c => {
      // If the table is set to preview mode and the colummn cannot be previewed
      if (config.preview && !c.preview) {
        return false;
      }
      return true;
    });

    if (config.hideIfEmpty) {
      return "";
    }

    /**
     * @type {AH_TableColumnHeader[]}
     */
    let headers = [];
    for (const column of columns) {
      const text = await column.renderHeader();
      headers.push({
        text: text,
      });
    }

    /**
     * @type {AH_TableRow[]}
     */
    const rows = [];

    // For every entry, make a row
    for (const entry of entries) {
      const key = this.getKey(entry);
      const visible = this.isVisible(entry);

      let cells = [];

      // For every configured column, render that column
      for (const column of columns) {
        const row = await column.renderCell(entry);
        cells.push({
          template: row,
        });
      }

      // Assign the row information
      rows.push({
        key: key,
        visible: visible,
        cells: cells,
      });
    }

    return renderTemplate("components/table", {
      config: config,
      headers,
      columns,
      rows,
    });
  }

  /**
   * @param {Object} entry
   * @virtual
   * @return {String}
   */
  getKey(entry) {
    throw Error("Not implemented");
  }

  /**
   * @param {Object} entry
   * @protected
   * @return {Boolean}
   */
  isVisible(entry) {
    return true;
  }

  /**
   * @returns {AH_TableColumnConfig[]}
   * @virtual
   */
  getColumns() {
    throw Error("Not implemented");
  }
}
