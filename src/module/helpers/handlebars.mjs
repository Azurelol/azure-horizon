import { systemTemplatePath } from "../constants.mjs";
import { FoundryUtils, ObjectUtils, StringUtils } from "../utils/_module.mjs";
import AH from "../config.mjs";
import { ChatMessageSectionTemplate } from "./chat-message-sections.mjs";
import TableColumns from "../apps/api/table-columns.mjs";

const COMPONENT_TEMPLATES = Object.freeze({
  empty: systemTemplatePath("components/empty"),

  table: systemTemplatePath("components/table"),

  tagPicker: systemTemplatePath("components/tag-picker"),
  documentAnchor: systemTemplatePath("components/document-anchor"),
  documentCarousel: systemTemplatePath("components/document-carousel"),

  traitsFieldSet: systemTemplatePath("components/traits-fieldset"),

  button: systemTemplatePath("components/button"),
  selector: systemTemplatePath("components/selector"),
  input: systemTemplatePath("components/input"),
  badge: systemTemplatePath("components/badge"),
  skeleton: systemTemplatePath("components/skeleton"),
  tooltip: systemTemplatePath("components/tooltip"),
  optionalFieldset: systemTemplatePath("components/optional-fieldset"),

  resourceBar: systemTemplatePath("components/resource-bar"),

  field: systemTemplatePath("components/field"),
  arrayField: systemTemplatePath("components/array-field"),
  stringField: systemTemplatePath("components/string-field"),
  traitsField: systemTemplatePath("components/traits-field"),
});

const MESSAGE_TEMPLATES = Object.freeze({
});

const DIALOG_TEMPLATES = Object.freeze({
  common: systemTemplatePath("dialogs/common"),
});

/**
 * @param {String} path
 * @param {Object} data
 * @returns {Handlebars.SafeString}
 */
function getTemplateString(path, data) {
  const template = Handlebars.partials[path];
  const html =
    typeof template === "function"
      ? template({
        ...data,
      })
      : "";
  return new Handlebars.SafeString(html);
}

export default Object.freeze({
  loadTemplates: async () => {
    let templates = [];
    templates.push(...Object.values(COMPONENT_TEMPLATES));
    templates.push(...Object.values(MESSAGE_TEMPLATES));
    templates.push(...Object.values(ChatMessageSectionTemplate));
    templates.push(...Object.values(DIALOG_TEMPLATES));
    templates.push(...Object.values(TableColumns.TEMPLATES));
    return foundry.applications.handlebars.loadTemplates(templates);
  },
  setupComponent: {
    tagPicker: setupTagPicker,
    resourceBar: setupResourceBar,
    iconRadioGroups,
  },
  registerPartials: async () => {

    Handlebars.registerPartial("ahOptionalFieldset", await foundry.applications.handlebars.getTemplate(COMPONENT_TEMPLATES.optionalFieldset));
  },
  registerHelpers: () => {
    Handlebars.registerHelper("ahFormOptions", formOptions);
    Handlebars.registerHelper("ahDocumentAnchor", documentAnchor);
    Handlebars.registerHelper("ahIconClass", function (icon) {
      if (!icon) {
        return "";
      }
      return AH.icons[icon];
    });
    Handlebars.registerHelper("ahNotEquals", function (a, b) {
      return a !== b;
    });
    Handlebars.registerHelper("ahLocaleKey", getLocaleKey);
    Handlebars.registerHelper("ahConcat", (...args) => {
      args.pop();
      return args.join("");
    });
    Handlebars.registerHelper("ahNotEmpty", val => {
      if (!val) return false;
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === "object") return Object.keys(val).length > 0;
      return true;
    },
    );
    // Creates array from arguments
    Handlebars.registerHelper("ahArray", function (...args) {
      return args.slice(0, -1);
    });
    // Render a fallback if the value is falsy for handlebars
    Handlebars.registerHelper("ahDefault", (value, fallback) => value ?? fallback);
    // Creates a plain object from the handlebars named parameters
    Handlebars.registerHelper("ahHash", function (options) {
      return options.hash;
    });
    Handlebars.registerHelper("ahSkeleton", skeleton);
    Handlebars.registerHelper("ahTagPicker", tagPicker);
    Handlebars.registerHelper("ahHumanize", function (str) {
      if (str && (typeof str === "string")) {
        return StringUtils.humanize(str);
      }
      return str;
    });
    Handlebars.registerHelper("ahCapitalize", value => {
      return value.charAt(0).toUpperCase() + value.slice(1);
    });
    Handlebars.registerHelper("ahUpperCase", value => {
      return value.toUpperCase();
    });
    Handlebars.registerHelper("ahMathAbs", value => {
      return Math.abs(value);
    });
    Handlebars.registerHelper("ahContains", function (collection, item) {
      if (Array.isArray(collection)) {
        return collection.includes(item);
      }
      if (collection instanceof Map) {
        return collection.has(item);
      }
      if (collection instanceof Set) {
        return collection.has(item);
      }
      if (collection instanceof Object) {
        return item in collection;
      }
      return false;
    });
    Handlebars.registerHelper("ahPercentage", function (value, max) {
      value = parseFloat(value);
      max = parseFloat(max);
      const percentage = (value / max) * 100;
      return percentage.toFixed(2) + "%";
    });
    Handlebars.registerHelper("ahImage", (src, classes, label) => {
      // eslint-disable-next-line no-undef
      if (VideoHelper.hasVideoExtension(src)) {
        return new Handlebars.SafeString(`<video class="${classes}" autoplay loop muted playsinline src="${src}" data-tooltip="${label}"></video>`);
      } else {
        return new Handlebars.SafeString(`<img class="${classes}" src="${src}" data-tooltip="${label}" alt="${label}">`);
      }
    });
    Handlebars.registerHelper("ahArrayField", arrayField);
    /**
     * @typedef AH_StringFieldOptions
     * @property label
     * @property path
     * @property value
     * @property options
     */
    Handlebars.registerHelper("ahStringField", function (options) {
      return getTemplateString(COMPONENT_TEMPLATES.stringField, {
        ...options.hash,
      });
    });
    /**
     * @typedef AH_TraitsFieldOptions
     * @property schema
     * @property label
     * @property path
     * @property value
     * @property options
     */
    Handlebars.registerHelper("ahTraitsField", function (options) {
      return getTemplateString(COMPONENT_TEMPLATES.traitsField, {
        ...options.hash,
      });
    });
    /**
     * @typedef AH_TraitsFieldOptions
     * @property schema
     * @property label
     * @property path
     * @property value
     */
    Handlebars.registerHelper("ahField", function (options) {
      return getTemplateString(COMPONENT_TEMPLATES.field, {
        ...options.hash,
      });
    });
    Handlebars.registerHelper("ahAutoComplete", autoComplete);
    Handlebars.registerHelper("ahBadge", badge);
    Handlebars.registerHelper("ahButton", button);
    Handlebars.registerHelper("ahSelector", selector);
    Handlebars.registerHelper("ahTraitsFieldset", traitsFieldset);
    Handlebars.registerHelper("ahInput", input);
    Handlebars.registerHelper("ahTooltip", tooltip);
    Handlebars.registerHelper("ahResourceBar", resourceBar);
    Handlebars.registerHelper("ahDocumentCarousel", documentCarousel);
    Handlebars.registerHelper("ahCheckOutcome",
      /**
       * @param result
       * @param difficulty
       */
      function (result, difficulty) {
        if (result.critical) {
          return "critical";
        } else if (result.fumble) {
          return "fumble";
        }

        if (Number.isInteger(difficulty)) {
          if (result.total >= difficulty) {
            return "success";
          } else {
            return "failure";
          }
        }

        return "default";
      },
    );
  },
});

/**
 * @typedef AH_LocalizationEntry
 * @property {String} long
 * @property {String} short
 * @property {String} plural
 * @property {undefined|String} label
 */

/**
 * @typedef {"long", "short", "plural"} AH_LocalizationFormat
 */

/**
 * Resolves a full localization key, given a record and a key in it.
 * @param {String} record
 * @param {String} key
 * @param {*} options
 * @param {AH_LocalizationFormat} options.format
 * @returns {*|string}
 */
function getLocaleKey(record, key, options) {
  if (AH[record] === undefined) {
    return "";
  }
  /** @type AH_LocalizationEntry **/
  let entry = AH[record][key];
  if (entry === undefined) {
    return "";
  }

  const format = options.hash?.format ?? "long";

  if (entry instanceof Object) {
    if (entry[format]) {
      return entry[format];
    }
    else if (entry.label) {
      return entry.label;
    }
  }
  else {
    return entry;
  }

  return entry;
}

/**
 * Writes autocomplete template.
 * @param context
 * @returns {Handlebars.SafeString}
 */
function autoComplete(context) {
  const dataset = context.hash;
  let options = dataset.options;
  if ((options !== null) && (typeof options === "object") && !Array.isArray(options)) {
    options = Object.keys(options);
  }
  const template = Handlebars.partials[systemTemplatePath("components/auto-complete")];
  const html =
    typeof template === "function"
      ? template({
        name: dataset.name,
        value: dataset.value,
        placeholder: dataset.placeholder,
        options: options,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @param {String} label
 * @param {*[]} tags
 * @param {*[]} selected
 * @param {Object} options
 * @returns {Handlebars.SafeString}
 */
function tagPicker(label, tags, selected, options) {
  if (options.hash) {
    options = options.hash;
  }

  const template = Handlebars.partials[systemTemplatePath("components/tag-picker")];
  const html =
    typeof template === "function"
      ? template({
        label: label,
        tags: tags,
        selected: selected,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @param {Object} options
 * @returns {Handlebars.SafeString}
 */
function skeleton(options) {
  if (options.hash) {
    options = options.hash;
  }

  const template = Handlebars.partials[systemTemplatePath("components/skeleton")];
  const html =
    typeof template === "function"
      ? template({
        ...options,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @callback TagPickerUpdateCallback
 * @param {string} id - The id of the picker that was updated, from `data-picker-id`.
 * @param {string} value - The tag value that was toggled, from `data-tag`.
 * @param {boolean} active - Whether the tag is now active or not.
 */

/**
 * @param {HTMLElement} html The root element to search for tag pickers.
 * @param {object} options
 * @param {String[]} [options.tags] The list of currently selected tags.
 * @param {TagPickerUpdateCallback} [options.onUpdate] - Callback invoked when a tag is toggled.
 */
async function setupTagPicker(html, options) {
  html.querySelectorAll(".ah-tag__picker").forEach(picker => {
    const toggle = picker.querySelector(".ah-tag__picker__toggle");
    const popup = picker.querySelector(".ah-tag__picker__popup");
    const count = toggle.querySelector(".ah-tag__picker__count");

    // Initialize count
    const initialCount = popup.querySelectorAll(".ah-tag__filter.active").length;
    count.textContent = `${initialCount}`;
    count.hidden = initialCount === 0;

    // Show tag picker on click
    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      // Close any other open pickers first
      html.querySelectorAll(".ah-tag__picker__popup.--open").forEach(p => {
        if (p !== popup) p.classList.remove("--open");
      });
      popup.classList.toggle("--open");

      if (popup.classList.contains("--open")) {
        const boundary = popup.closest(".window-content") ?? document.documentElement;
        const boundaryRect = boundary.getBoundingClientRect();
        const rect = popup.getBoundingClientRect();
        if (rect.right > boundaryRect.right) {
          popup.classList.add("--flip");
        } else {
          popup.classList.remove("--flip");
        }
      }
    });

    // Toggle tag on click
    popup.querySelectorAll(".ah-tag__filter").forEach((tag) => {
      tag.addEventListener("click", () => {
        const value = tag.dataset.tag;
        tag.classList.toggle("active");

        // Update count badge
        const activeTags = popup.querySelectorAll(".ah-tag__filter.active").length;
        count.textContent = `${activeTags}`;
        count.hidden = activeTags === 0;

        options.onUpdate?.(picker.id, value, tag.classList.contains("active"));
      });
    });
  });

  // Close all pickers when clicking outside
  document.addEventListener("click", () => {
    html.querySelectorAll(".ah-tag__picker__popup.--open").forEach(p => {
      p.classList.remove("--open");
    });
  });
}

/**
 * @param {Object} document
 * @param {Object} options
 * @returns {Handlebars.SafeString}
 */
function documentAnchor(document, options) {
  if (!document) {
    console.warn("Missing document information for rendering. Ignoring...");
    return "";
  }

  const size = options.hash?.size ?? "s";
  const type = options.hash.type ?? "Item";
  const template = Handlebars.partials[COMPONENT_TEMPLATES.documentAnchor];
  const html =
    typeof template === "function"
      ? template({
        name: document.name,
        uuid: document.uuid,
        id: document.id,
        img: document.img,
        pack: document.pack,
        type: type,
        size: size,
        classes: options.hash?.classes,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @typedef AHArrayFieldOptions
 * @property {*[]} array
 * @property {String} label
 * @property {String} path
 * @property {'string'} type
 * @property {String[]|undefined} options
 */

/**
 * @param {AHArrayFieldOptions} options
 * @returns {Handlebars.SafeString}
 */
function arrayField(options) {
  options = options.hash;
  const template = Handlebars.partials[COMPONENT_TEMPLATES.arrayField];
  const html =
    typeof template === "function"
      ? template({
        array: options.array,
        label: options.label,
        path: options.path,
        type: options.type,
        options: options.options,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @typedef {'l'|'m'|'s'}  AH_IconSize
 */

/**
 * @typedef AH_BadgeOptions
 * @property icon
 * @property label
 * @property value
 * @property iconClass
 * @property {AH_IconSize} size
 */

/**
 * @param options
 * @param {AH_BadgeOptions} options.hash
 * @returns {Handlebars.SafeString}
 */
function badge(options) {
  if (options.hash?.iconClass) {
    options.hash.icon = AH.icons[options.hash.iconClass];
  }
  const size = options.hash?.size ?? "s";
  const template = Handlebars.partials[systemTemplatePath("components/badge")];
  const html =
    typeof template === "function"
      ? template({
        size,
        ...options.hash,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @typedef AH_ButtonOptions
 * @property {String} label
 * @property {String} action
 * @property {String} tooltip
 * @property {String} buttonClass
 * @property {String} iconClass
 * @property {AH_IconSize} size
 */

/**
 * @param options
 * @param {AH_ButtonOptions} options.hash
 * @returns {Handlebars.SafeString}
 */
function button(options) {
  const dataAttributes = (options.hash.data ?? "")
    .split(";")
    .filter(Boolean)
    .map(pair => {
      const [key, value] = pair.split("=");
      return `data-${key.trim()}="${value.trim()}"`;
    })
    .join(" ");

  options.hash.size ??= "s";

  const template = Handlebars.partials[COMPONENT_TEMPLATES.button];
  const html =
    typeof template === "function"
      ? template({
        ...options.hash,
        dataAttributes,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @param options
 * @returns {Handlebars.SafeString}
 */
function selector(options) {
  const template = Handlebars.partials[COMPONENT_TEMPLATES.selector];
  const size = options.hash.size ?? "s";
  const html =
    typeof template === "function"
      ? template({
        size,
        ...options.hash,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @typedef InputOptions
 * @property icon
 * @property label
 * @property type
 */

/**
 * @param {String} path
 * @param {String} value
 * @param options
 * @param {InputOptions} options.hash
 * @returns {Handlebars.SafeString}
 */
function input(path, value, options) {
  const template = Handlebars.partials[COMPONENT_TEMPLATES.input];
  const size = options.hash.size ?? "s";
  const html =
    typeof template === "function"
      ? template({
        size,
        path: path,
        value: value,
        ...options.hash,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @typedef OptionalFieldsetOptions
 * @property icon
 * @property label
 * @property {Boolean} enabled The value of the property that toggles the fieldset
 * @property {String} name The path to the property that toggles the fieldset
 */

/**
 * @param options
 * @returns {Handlebars.SafeString}
 */
function optionalFieldset(partial, options) {
  const template = Handlebars.partials[COMPONENT_TEMPLATES.optionalFieldset];
  const html =
    typeof template === "function"
      ? template({
        ...options.hash,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @typedef AH_ResourceBarOptions
 * @property icon
 * @property label
 * @property tooltip
 * @property path
 * @property color
 * @property {Number} value
 * @property {Number} max
 *
 */

/**
 * @param {String} path
 * @param {Number} value
 * @param {Number} max
 * @param options
 * @param {AH_ResourceBarOptions} options.hash
 * @returns {Handlebars.SafeString}
 */
function resourceBar(path, value, max, options) {
  const template = Handlebars.partials[systemTemplatePath("components/resource-bar")];
  const html =
    typeof template === "function"
      ? template({
        path: path,
        value: value,
        max: max,
        ...options.hash,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @param {HTMLElement} html
 */
function setupResourceBar(html) {
  const bars = html.querySelectorAll(".ah-resource-bar__control");
  for (const bar of bars) {
    const input = bar.querySelector(".ah-resource-bar__control__input");
    bar.addEventListener("click", (event) => {
      if (bar.classList.contains("editing")) return;
      bar.classList.add("editing");
      input.focus();
      input.select();
    });

    input.addEventListener("click", (event) => { event.stopPropagation(); });

    const commit = () => {
      bar.classList.remove("editing");

      const rawValue = input.value.trim();
      const isDelta = /^[+-]\d+$/.test(rawValue);

      if (isDelta) {
        const currentValue = Number(bar.dataset.current ?? 0);
        const delta = parseInt(rawValue, 10);
        input.value = currentValue + delta;
      }

      input.dispatchEvent(new Event("change", { bubbles: true }));
    };
    input.addEventListener("blur", commit);

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      } else if (event.key === "Escape") {
        input.value = bar.dataset.value ?? input.defaultValue;
        bar.classList.remove("editing");
      }
    });

    FoundryUtils.contextMenu(html, ".ah-resource-bar__control", [
      {
        name: "AH.COMMON.Full",
        icon: AH.icons.full,
        condition: (target) => !target.classList.contains("editing"),
        callback: (target) => {
          const bar = target instanceof HTMLElement ? target : target[0];
          const input = bar.querySelector(".ah-resource-bar__control__input");
          const maxValue = Number(bar.dataset.max ?? 0);

          input.value = maxValue;
          bar.dataset.value = maxValue;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        },
      },
      {
        name: "AH.COMMON.Half",
        icon: AH.icons.half,
        condition: (target) => !target.classList.contains("editing"),
        callback: (target) => {
          const bar = target instanceof HTMLElement ? target : target[0];
          const input = bar.querySelector(".ah-resource-bar__control__input");
          const maxValue = Number(bar.dataset.max ?? 0);

          const halfValue = Math.round(maxValue * 0.5);
          input.value = halfValue;
          bar.dataset.value = halfValue;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        },
      },
      {
        name: "AH.COMMON.Empty",
        icon: AH.icons.half,
        condition: (target) => !target.classList.contains("editing"),
        callback: (target) => {
          const bar = target instanceof HTMLElement ? target : target[0];
          const input = bar.querySelector(".ah-resource-bar__control__input");
          const maxValue = Number(bar.dataset.max ?? 0);

          input.value = 0;
          bar.dataset.value = 0;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        },
      },
    ]);
  }
}

/**
 * @param documents
 * @param options
 * @returns {Handlebars.SafeString}
 */
function documentCarousel(documents, options) {
  const template = Handlebars.partials[COMPONENT_TEMPLATES.documentCarousel];
  const html =
    typeof template === "function"
      ? template({
        documents: documents,
        ...options.hash,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @param {HTMLElement} element
 * @param {Record} context
 */
function iconRadioGroups(element, context) {
  // Get all radio inputs in the dialog
  const allRadios = element.querySelectorAll(".ah-icon__radio-group label input[type='radio']");
  // Group radios by their "name"
  const radiosByGroup = Array.from(allRadios).reduce((groups, radio) => {
    const name = radio.name;
    if (!groups[name]) groups[name] = [];
    groups[name].push(radio);
    return groups;
  }, {});

  // Iterate over each group
  Object.entries(radiosByGroup).forEach(([groupName, radios]) => {
    // Set initial selection from the map
    const selectedValue = context[groupName];
    radios.forEach((radio) => {
      const label = radio.parentElement;
      if (radio.value === selectedValue) {
        radio.checked = true;
        label.classList.add("selected");
      } else {
        radio.checked = false;
        label.classList.remove("selected");
      }

      // Attach change listener
      radio.addEventListener("change", () => {
        radios.forEach((r) => r.parentElement.classList.remove("selected"));
        if (radio.checked) radio.parentElement.classList.add("selected");
      });
    });
  });
}

/**
 * @param {String} key
 * @param options
 * @param {AH_LocalizationFormat} options.format
 * @returns {FormSelectOption[]}
 */
function formOptions(key, options) {
  const record = ObjectUtils.getProperty(AH, key);
  const format = options.hash?.format ?? "long";
  const formOptions = FoundryUtils.getFormSelectOptions(record, format);
  return formOptions;
}

/**
 * @typedef AH_TooltipOptions
 * @property {'help'|'info'|'warning'} type
 * @property
 */

/**
 * @param {String} text
 * @param {AH_TooltipOptions} options
 * @returns {Handlebars.SafeString}
 */
function tooltip(text, options) {
  if (options.hash) {
    options = options.hash;
  }

  const type = options.type ?? "help";
  const template = Handlebars.partials[COMPONENT_TEMPLATES.tooltip];
  const html =
    typeof template === "function"
      ? template({
        text: text,
        type,
        ...options,
      })
      : "";
  return new Handlebars.SafeString(html);
}

/**
 * @param {TraitsDataModel|TraitsPredicateDataModel} model
 * @param {String} path The path to the property.
 * @param options
 * @returns {Handlebars.SafeString}
 */
function traitsFieldset(model, path, options) {
  options = options.hash;
  const template = Handlebars.partials[systemTemplatePath("components/traits")];
  const html =
    typeof template === "function"
      ? template({
        model: model,
        path: path,
        traitOptions: model.schema.options?.options ?? {},
        quantifierOptions: AH.predicateQuantifier,
        showLabel: options.showLabel ?? false,
      })
      : "";
  return new Handlebars.SafeString(html);
}
