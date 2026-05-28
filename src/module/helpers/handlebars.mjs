import { systemTemplatePath } from "../constants.mjs";
import { FoundryUtils, ObjectUtils, StringUtils } from "../utils/_module.mjs";
import AH from "../config.mjs";

export default Object.freeze({
  loadTemplates: async () => {
    return foundry.applications.handlebars.loadTemplates([
      systemTemplatePath("components/document-anchor"),
      systemTemplatePath("components/tag-picker"),
      systemTemplatePath("components/skeleton"),
    ]);
  },
  setupComponent: {
    tagPicker: setupTagPicker,
  },
  registerHelpers: () => {
    Handlebars.registerHelper("ahFormOptions", function (constant) {
      const record = ObjectUtils.getProperty(AH, constant);
      const options = FoundryUtils.getFormSelectOptions(record);
      return options;
    });
    Handlebars.registerHelper("ahDocumentAnchor", documentAnchor);
    Handlebars.registerHelper("ahIconClass", function (icon) {
      if (!icon) {
        return "";
      }
      return AH.icons[icon];
    });
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
    Handlebars.registerHelper("ahImage", (src, classes, label) => {
      // eslint-disable-next-line no-undef
      if (VideoHelper.hasVideoExtension(src)) {
        return new Handlebars.SafeString(`<video class="${classes}" autoplay loop muted playsinline src="${src}" data-tooltip="${label}"></video>`);
      } else {
        return new Handlebars.SafeString(`<img class="${classes}" src="${src}" data-tooltip="${label}" alt="${label}">`);
      }
    });
    Handlebars.registerHelper("ahArrayField", arrayField);
  },
});

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
 * @param {DocumentImageOptions} options
 * @returns {Handlebars.SafeString}
 */
function documentAnchor(document, options) {
  if (!document) {
    console.warn("Missing document information for rendering. Ignoring...");
    return "";
  }

  if (options.hash) {
    options = options.hash;
  }

  const size = options.size ?? "s";
  const type = options.type ?? "Item";
  const template = Handlebars.partials[systemTemplatePath("partials/document-anchor")];
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
        classes: options?.classes,
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
  const template = Handlebars.partials[systemTemplatePath("components/array-field")];
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
