import { ObjectUtils, StringUtils } from "./_module.mjs";
import { enrichHTML } from "../constants.mjs";

const { api, fields, handlebars } = foundry.applications;
const TextEditor = foundry.applications.ux.TextEditor.implementation;

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
   * @param {Record<String, String>} record   *
   * @param {'short'|'long'} variant
   * @returns {FormSelectOption[]}
   * @remarks To be used with specific records.
   */
  static getFormSelectOptions(record, variant) {
    return Object.entries(record).map(([key, value]) => ({
      label: StringUtils.localize(variant ? `${value}.${variant}` : value),
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
   * @param {AHActor} actor
   * @returns {*}
   */
  static resolveSpeaker(actor) {
    let speaker = ChatMessage.getSpeaker({ actor });
    if (speaker.scene && speaker.token) {
      const token = game.scenes.get(speaker.scene)?.tokens?.get(speaker.token);
      if (token) {
        speaker = ChatMessage.getSpeaker({ token });
      }
    }
    return speaker;
  }

  /**
   * @remarks This follows the 'key:value' format used in the system's CONFIG file
   * @param {string[]} keys
   * @param {Record<string, string>} labelRecord
   * @param {Record<string, string>} iconRecord
   * @returns {FormSelectOption[]}
   */
  static generateConfigIconOptions(keys, labelRecord, iconRecord) {
    return Array.from(keys).map((key) => ({
      label: StringUtils.localize(labelRecord[key]),
      icon: iconRecord[key],
      value: key,
    }));
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
   * Recursively add system model fields to the fieldset.
   */
  static async #addSystemFields(fieldset, schema, source, _path = "system") {
    for (const field of Object.values(schema)) {
      const path = `${_path}.${field.name}`;
      if (field instanceof foundry.data.fields.SchemaField) {
        this.#addSystemFields(fieldset, field.fields, source, path);
      } else if (field.constructor.hasFormSupport) {
        fieldset.fields.push({ field, value: foundry.utils.getProperty(source, path) });
      }
    }
  }

  /**
   * @typedef AH_DataFieldInfo
   * @property {String} path The path to the field.
   * @property field The foundry data field.
   * @property {Object} value
   * @property {String} template The partial template path.
   */

  /**
   * Gets a document's fields of a type
   * @param {Document} document
   * @param {string|number} documentClass
   * @param {string|number} fieldClass
   * @param {string} path
   * @returns {Promise<AH_DataFieldInfo[]>}
   */
  static async getFieldsOfType(document, documentClass, fieldClass, path) {
    const source = document._source;
    const systemFields = CONFIG[documentClass].dataModels[document.type]?.schema.fields;
    /** @type AH_DataFieldInfo[] **/
    const fields = [];
    for (const field of Object.values(systemFields ?? {})) {
      if (field.options?.config === false) {
        continue;
      }
      const fieldPath = `${path}.${field.name}`;
      if (field instanceof foundry.data.fields[fieldClass]) {
        const value = foundry.utils.getProperty(source, fieldPath);
        let data = {
          field: field,
          path: fieldPath,
          value: value,
        };
        if (field.model?.template) {
          data.template = field.model.template;
        }
        fields.push(data);
      }
    }
    return fields;
  }

  /**
   * @typedef AH_EnrichedTextField
   * @property field
   * @property {String} path
   * @property {String} text
   */

  /**
   * @param document
   * @param documentClass
   * @param {EnrichmentOptions} options
   * @returns {Promise<Record<String, AH_EnrichedTextField>>}
   */
  static async getEnriched(document, documentClass, options) {
    const htmlFields = await FoundryUtils.getFieldsOfType(document, documentClass, "HTMLField", "system");

    let map = {};

    for (const field of htmlFields) {
      const enrichedText = await enrichHTML(field.value, options);
      map[field.path] = enrichedText;
    }

    return map;
  }

}
