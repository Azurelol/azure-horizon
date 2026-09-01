import { enrichHTML } from "../constants.mjs";
import StringUtils from "./string-utils.mjs";

const { api, fields, handlebars } = foundry.applications;
const { SchemaField, ArrayField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
const TextEditor = foundry.applications.ux.TextEditor.implementation;
const SUPPORTED_FIELD_NAMES = new Set(["StringField", "NumberField", "BooleanField", "ObjectField"]);
const SYSTEM_FIELD_NAMES = new Set(["TraitsField"]);

export default class FoundryUtils {

  /**
   * @returns {AHActor}
   */
  static get mockHero() {
    if (!this.#dummyActor) {
      this.#dummyActor = new foundry.documents.Actor.implementation({ type: "hero", name: "Temporary Hero" });
    }
    return this.#dummyActor;
  }
  static #dummyActor;

  /**
   * @param {String} src
   * @param {String} title
   * @param {String} uuid
   */
  static popoutImage(src, title, uuid = undefined) {
    // eslint-disable-next-line no-undef
    const popout = new ImagePopout(src, {
      title: title,
      uuid: uuid,
    });
    popout.render(true);
  }

  /**
   * @param {String} str
   * @return {Boolean}
   */
  static isUUID(str) {
    if (typeof str !== "string") return false;

    return /^(?:Compendium\.[^.\s]+\.[^.\s]+\.)?(?:[A-Za-z]+\.)?[A-Za-z0-9]{16}(?:\.[A-Za-z]+\.[A-Za-z0-9]{16})*$/.test(str);
  }

  /**
   * @param {DataModel} model
   * @param {Object} overrides
   * @returns {function(): *}
   */
  static initializeFields(model, overrides) {
    return () => foundry.utils.mergeObject(
      model.cleanData(), // pulls full defaults from DamageDataModel's own schema
      //      overrides,             // only the fields you want to override
      { inplace: false },
    );
  }

  /**
   * @param {DataModel} model
   * @param {Object} overrides
   * @returns {{initial: function(): *}}
   */
  static configureInitial(model, overrides) {
    return {
      initial: FoundryUtils.initializeFields(model, overrides),
    };
  }

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
   * @param {Record} record
   * @param {AH_LocalizationFormat} format
   * @returns {{[p: string]: undefined}}
   */
  static flattenOptions(record, format = "long") {
    return Object.fromEntries(
      Object.entries(record).map(([key, entry]) => [key, entry[format]]),
    );
  }

  /**
   * @param {Object} value
   * @param {AH_LocalizationFormat} format
   * @returns {*}
   */
  static #resolveConfigRecordLabel(value, format) {
    if (format) {
      if (value[format]) {
        return value[format];
      }
      if (value.label) {
        return value.label;
      }
    }
    return value;
  }

  /**
   * @param {Record<String, String>} record   *
   * @param {AH_LocalizationFormat} format
   * @returns {FormSelectOption[]}
   * @remarks To be used with specific records.
   */
  static getFormSelectOptions(record, format = "long") {
    return Object.entries(record).map(([key, value]) => ({
      label: StringUtils.localize(FoundryUtils.#resolveConfigRecordLabel(value, format)),
      value: key,
    }));
  }

  /**
   * @template T
   * @param {T[]} values
   * @param {(T) => String} getLabel
   * @param {(T) => String} getValue
   * @returns {FormSelectOption[]}
   * @remarks To be used with specific records.
   */
  static fromValuesToFormSelectOptions(values, getLabel, getValue = undefined) {
    return values.map(v => ({
      label: getLabel(v),
      value: getValue ? getValue(v) : v,
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
      label: StringUtils.localize(labelRecord[key].long ?? labelRecord[key].label),
      icon: iconRecord[key],
      value: key,
    }));
  }

  /**
   * @typedef AH_ContextMenuItem
   * @property name
   * @property img
   * @property icon
   * @property {() => Promise|void} perform
   */

  /**
   * @param {HTMLElement} html
   * @param {String} className
   * @param {(AHItem|AH_ContextMenuItem)[]} items
   * @param {function(AHItem): Promise<void>} [action]
   * @param {Boolean} quick
   * @remarks {Boolean} True if the context menu was set.
   */
  static itemContextMenu(html, className, items, action = undefined, quick = false) {
    const entries = items
      .toSorted((a, b) => a.name.localeCompare(b.name))
      .map((item) => {
        return {
          label: item.name,
          icon: item.img ? `<img class="ah-icon --xs" src="${item.img}" alt="${item.name}"/>`
            : `<i class='ah-icon --xs ${item.icon}'></i>`,
          onClick: async (html) => {
            if (action) {
              return action(item);
            }
            if (item.perform) {
              return item.perform();
            }
          },
        };
      });

    if ((entries.length === 1) && quick) {
      html.querySelectorAll(className).forEach((el) => {
        el.addEventListener(
          "click",
          () => {
            return entries[0].onClick(el);
          },
        );
      });
    }
    else if (entries.length === 0) {
      html.querySelectorAll(className).forEach((el) => {
        el.addEventListener(
          "click",
          () => {
            ui.notifications.warn(StringUtils.localize("AH.DIALOG.WARNING.EntriesMissing", {
              type: className,
            }));
          },
          { once: true },
        );
      });
      return false;
    }
    else {
      new foundry.applications.ux.ContextMenu(html, className, entries, {
        eventName: "click",
        fixed: true,
        jQuery: false,
      });

    }
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
   * @property {Boolean} optional If the field is optional.
   * @property {Boolean} isArray
   */

  /**
   * @param source
   * @param fieldPath
   * @param field
   * @returns {AH_DataFieldInfo}
   */
  static getDataFieldInfo(source, fieldPath, field) {
    const value = foundry.utils.getProperty(source, fieldPath);
    let data = {
      label: field.options.label ?? StringUtils.capitalize(field.name),
      name: field.name,
      field: field,
      path: fieldPath,
      options: field.options,
      model: value,
      value: value,
      optional: field.fields?.enabled !== undefined,
      active: value.enabled || value.required,
    };
    if (field.model?.template) {
      data.template = field.model.template;
    }
    return data;
  }

  /**
   * @typedef AH_FieldsetMap
   * @property {AH_DataFieldInfo[]} fieldsets
   */

  /**
   * Gets a document's fields of a type, recursively descending into nested schemas.
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
    this._collectFieldsOfType(source, systemFields, fieldClass, path, fields);
    return fields;
  }

  /**
   * Recursively walks a schema's fields, collecting every field matching fieldClass -
   * including ones nested inside SchemaFields/EmbeddedDataFields at any depth.
   * @param {object} source
   * @param {Object<string, foundry.data.fields.DataField>} schemaFields
   * @param {string} fieldClass
   * @param {string} path
   * @param {AH_DataFieldInfo[]} fields
   * @private
   */
  static _collectFieldsOfType(source, schemaFields, fieldClass, path, fields) {
    for (const field of Object.values(schemaFields ?? {})) {
      if (field.options?.config === false) continue;

      const fieldPath = `${path}.${field.name}`;

      if (field instanceof foundry.data.fields[fieldClass]) {
        fields.push(this.getDataFieldInfo(source, fieldPath, field));
      }

      // Recurse into any field that carries its own nested schema
      if (field.fields) {
        this._collectFieldsOfType(source, field.fields, fieldClass, fieldPath, fields);
      }
    }
  }

  /**
   * @typedef {'header'|'properties'} AH_FieldRenderGroup
   */

  /**
   * @typedef AH_FieldRenderMap
   * @desc Used for figuring out where to render generic fields that need no custom rendering.
   * @property {AH_DataFieldInfo[]} default
   * @property {AH_DataFieldInfo[]} header
   */

  /**
   * @param {Document} document
   * @param {string|number} documentClass
   * @param {String} path
   * @returns {AH_FieldRenderMap}
   */
  static getPrimitiveFields(document, documentClass, path) {
    const source = document._source;
    const systemFields = CONFIG[documentClass].dataModels[document.type]?.schema.fields;

    /** @type AH_FieldRenderMap **/
    const layout = {
      default: [],
      header: [],
    };

    /** @type AH_DataFieldInfo[] **/
    for (const field of Object.values(systemFields ?? {})) {
      if (field.options?.config === false) {
        continue;
      }
      const fieldPath = `${path}.${field.name}`;
      let fieldClass = field.constructor.name;
      // Support 1-level nested schema fields (which are very common)
      if (fieldClass === "SchemaField") {
        const schemaFields = Object.values(field.fields);
        for (const sf of schemaFields) {
          const sfieldInfo = this.getDataFieldInfo(source, `${fieldPath}.${sf.name}`, sf);
          switch (sf.options?._part) {
            case "header":
              layout.header.push(sfieldInfo);
              break;
            case "properties":
              layout.default.push(sfieldInfo);
              break;
          }
        }
      }
      // Support array fields
      else if (fieldClass === "ArrayField") {
        if (field.element instanceof StringField) {
          const fieldInfo = this.getDataFieldInfo(source, fieldPath, field);
          fieldInfo.isArray = true;
          layout.default.push(fieldInfo);
        }
      }
      // Primitives
      else if (!field.recursive && (SUPPORTED_FIELD_NAMES.has(fieldClass) || SYSTEM_FIELD_NAMES.has(fieldClass))) {
        let fieldInfo = this.getDataFieldInfo(source, fieldPath, field);
        // Custom rendering targets for the system
        if (field.options?._part === "header") {
          layout.header.push(fieldInfo);
        }
        else {
          layout.default.push(fieldInfo);
        }
      }

    }
    return layout;
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

  /**
   * @return {AHActor[]}
   */
  static getOwnedActors(type) {
    return game.actors.filter((a) => (a.type === type) && a.testUserPermission(game.user, "OWNER"));
  }

  /**
   * @param imagePath
   * @returns {Promise<Tile>}
   */
  static async placeTile(imagePath) {
    const scene = game.scenes.viewed;

    // Get image dimensions to use as default tile size
    // eslint-disable-next-line no-undef
    const tex = await loadTexture(imagePath);
    let width, height;

    const promptTitle = `${StringUtils.localize("CONTROLS.TilePlace")} - Preset`;
    const preset = await FoundryUtils.selectOptionDialog(promptTitle, [
      {
        label: StringUtils.localizeMultiple(["Token", "Scale"]),
        value: "token",
      },
      {
        label: StringUtils.localizeMultiple(["Default", "Scale"]),
        value: "default",
      },
    ]);
    switch (preset) {
      case "token":
        {
          const scale = Math.min(100 / tex.width, 100 / tex.height);
          width = tex.width * scale;
          height = tex.height * scale;
        }
        break;
      case "default":
        width = tex.width;
        height = tex.height;
        break;
    }

    if (!preset) {
      return;
    }

    const notification = ui.notifications.info("Left click to place tile on the active scene, right click to cancel the operation.", { permanent: true });

    return new Promise((resolve) => {
      const clickHandler = async (event) => {
        const { x, y } = event.getLocalPosition(canvas.stage);

        cleanup();

        const [tileDocument] = await scene.createEmbeddedDocuments("Tile", [
          {
            texture: { src: imagePath },
            width,
            height,
            x: x - width / 2,
            y: y - height / 2,
          },
        ]);

        canvas.tiles.releaseAll();
        resolve(tileDocument);
      };

      const rightClickHandler = () => {
        cleanup();
        ui.notifications.warn("Cancelled tile placement.");
        resolve(null); // cancelled
      };

      const cleanup = () => {
        canvas.stage.off("click", clickHandler);
        canvas.stage.off("rightclick", rightClickHandler);
        ui.notifications.remove(notification);
      };

      canvas.stage.on("click", clickHandler);
      canvas.stage.on("rightclick", rightClickHandler);
    });
  }

}
