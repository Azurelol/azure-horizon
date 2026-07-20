import { StringUtils } from "./_module.mjs";

const { api, fields, handlebars } = foundry.applications;

export default class FoundryUtils {
  /**
   * @param {HTMLElement} target
   * @returns {Object}
   */
  static getFormData(target) {
    const form = target.closest("form");
    // eslint-disable-next-line no-undef
    const formData = new FormDataExtended(form);
    return foundry.utils.expandObject(formData.object);
  }

  /**
   * @typedef FormSelectOption
   * @property {string} [value]
   * @property {string} [label]
   * @property {string} [group]
   * @property {boolean} [disabled]
   * @property {boolean} [selected]
   * @property {boolean} [rule]
   * @property {Record<string, string>} [dataset]
   */

  /**
   * @param {Record<String, String>} record
   * @returns {FormSelectOption[]}
   * @remarks To be used with specific records.
   */
  static getFormSelectOptions(record) {
    return Object.entries(record).map(([key, value]) => ({
      label: StringUtils.localize(value),
      value: key,
    }));
  }

  /**
   * @callback ContextMenuCallback
   * @param {HTMLElement} target                          The element that the context menu has been triggered for.
   * @returns {unknown}
   */

  /**
   * @typedef ContextMenuEntry
   * @property {string} name                              The context menu label. Can be localized.
   * @property {string} [icon]                            A string containing an HTML icon element for the menu item.
   * @property {string} [classes]                         Additional CSS classes to apply to this menu item.
   * @property {string} [group]                           An identifier for a group this entry belongs to.
   * @property {ContextMenuJQueryCallback} callback       The function to call when the menu item is clicked.
   * @property {ContextMenuCondition|boolean} [condition] A function to call or boolean value to determine if this entry
   *                                                      appears in the menu.
   */

  /**
   * @typedef {'click'|'contextmenu'|'pointerdown'|'pointermove'|'mouseover'} ContextMenuEventName
   */

  /**
   * @typedef ContextMenuOptions
   * @property {ContextMenuEventName} [eventName="contextmenu"] Optionally override the triggering event which can spawn the menu. If
   *                                              the menu is using fixed positioning, this event must be a MouseEvent.
   * @property {ContextMenuCallback} [onOpen]     A function to call when the context menu is opened.
   * @property {ContextMenuCallback} [onClose]    A function to call when the context menu is closed.
   * @property {boolean} [fixed=false]            If true, the context menu is given a fixed position rather than being
   *                                              injected into the target.
   * @property {boolean} [jQuery=true]            If true, callbacks will be passed jQuery objects instead of HTMLElement
   *                                              instances.
   */

  /**
   * @param html
   * @param {String} className
   * @param {ContextMenuEventName} eventName
   * @param {ContextMenuEntry[]} entries
   */
  static contextMenu(html, className, entries, eventName = "contextmenu") {
    new foundry.applications.ux.ContextMenu(html, className, entries, {
      eventName: eventName,
      fixed: true,
      jQuery: false,
    });
  }

  /**
   * @param {HTMLElement} html
   * @param {String} className
   * @param {AHItem[]} items
   * @param {function(AHItem): Promise<void>} [action]
   * @remarks {Boolean} True if the context menu was set.
   */
  static itemContextMenu(html, className, items, action = undefined) {
    const entries = items
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .map((item) => {
        return {
          name: item.name,
          icon: `<img class="ah-icon--xs" src="${item.img}" alt="${item.name}"/>`,
          callback: async (html) => {
            if (action) {
              return action(item);
            }
            if (item.roll) {
              return item.roll();
            }
          },
        };
      });

    if (entries.length === 0) {
      html.querySelectorAll(className).forEach((el) => {
        el.addEventListener(
          "click",
          () => {
            ui.notifications.warn(StringUtils.localize("AH.DIALOG.EntriesMissing"));
          },
          { once: true },
        );
      });
      return false;
    }

    new foundry.applications.ux.ContextMenu(html, className, entries, {
      eventName: "click",
      fixed: true,
      jQuery: false,
    });

    return true;
  }
}
