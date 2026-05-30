/**
 * @typedef KeyboardModifiers
 * @property {boolean} shift
 * @property {boolean} alt
 * @property {boolean} ctrl
 * @property {boolean} meta
 */

/**
 * @typedef {'medium'|'large'|'portrait'|'wide'} ViewerLayout
 */

import { StringUtils } from "./_module.mjs";

/**
 * Utility functions for working with {@link HTMLElement}.
 * @type {Readonly<{findWithDataset: ((function(HTMLElement): ({dataset}|HTMLElement|null))|*)}>}
 */
export default class HTMLUtils {

  /**
   * @param {HTMLElement} element
   * @returns {{dataset}|HTMLElement|null}
   */
  static findWithDataset(element) {
    let current = element;
    while (current) {
      if (current.dataset && (Object.keys(current.dataset).length > 0)) {
        return current;
      }
      current = current.parentElement;
    }
    return null;
  }

  /**
   * @param {PointerEvent|MouseEvent} event
   * @returns {KeyboardModifiers}
   */
  static getKeyboardModifiers(event) {
    return {
      shift: event?.shiftKey ?? false,
      alt: event?.altKey ?? false,
      ctrl: event?.ctrlKey ?? false,
      meta: event?.metaKey ?? false,
    };
  }

  /**
   * @param {RegExpMatchArray} match
   * @param {DOMStringMap} dataset
   */
  static appendRegexGroupsToDataset(match, dataset) {
    if (!match?.groups) return;

    for (const [key, value] of Object.entries(match.groups)) {
      dataset[key] = value ?? "";
    }
  }

  /**
   * @param fn A function.
   * @param ms The time in milliseconds.
   * @returns {(function(...[*]): void)|*}
   */
  static debounce (fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  /**
   * @desc Sets up basic input safeguards.
   * @param html
   */
  static setupInputs (html) {
    html.querySelectorAll("input").forEach((input) => {
      input.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      });
    });
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

  /**
   * @param {String} name
   * @returns {string}
   */
  static getCSSVariable(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  /**
   * @param {Number} width
   * @param {Number} height
   * @returns {{ratio: string, w: number, h: number}}
   */
  static getAspectRatio(width, height) {
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    return {
      ratio: `${width / divisor} / ${height / divisor}`,
      w: width / divisor,
      h: height / divisor,
    };
  }

  /**
   * @desc Resolves the natural dimensions of an image from a path.
   * @param {string} src
   * @returns {Promise<[number, number]>} [width, height].
   */
  static resolveImageDimensions(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve([img.naturalWidth, img.naturalHeight]);
      img.onerror = () => resolve([0, 0]); // fallback to default layout
      img.src = src;
    });
  }

  /**
   * @param {number} width
   * @param {number} height
   * @param {number} textLength
   * @returns {ViewerLayout|null}
   */
  static getViewerLayout(width, height, textLength) {
    const ratio = width / height;

    if ((ratio < 0.9) || (textLength <= 50)) return "portrait";
    if (width >= 600) return "large";
    if (textLength > 500) return "wide";
    if ((width >= 300) && (textLength >= 500)) return "medium";
    return null;
  }
}
