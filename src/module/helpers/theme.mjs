import { ObjectUtils, StringUtils } from "../utils/_module.mjs";
import { systemID } from "../constants.mjs";

/**
 * @typedef {Object} ThemeOptions
 *
 * === Controls - Default ===
 * @property {string} colorControlContent
 * @property {string} colorControlBorder
 * @property {string} colorControlFocusContent
 * @property {string} colorControlInactiveContent
 * @property {string} colorControlFill1
 * @property {string} colorControlFill2
 *
 * === Apps - Body ===.
 * @property {string} colorAppBodyContent
 * @property {string} colorAppBodyContentSecondary
 * @property {string} colorAppBodyPrimaryFill1
 * @property {string} colorAppBodyPrimaryFill2
 * @property {string} colorAppNameSectionContent
 * @property {string} colorAppNameSectionShadow
 *
 * === Images ===.
 * @property {string} uiAccentImage
 * @property {string} appAccentImage
 * @property {string} appBgImage
 * @property {string} appSectionBgImage
 * @property {string} sidebarBgImage
 *
 * === Advanced ===.
 * @property {string} advanced
 */

/**
 * @typedef ThemeOptionField
 * @property {String} label
 * @property {'color'|'image'|'text'} type
 * @property {String} default
 * @property {String} variable If set, will override the default key -> variable mapping.
 */

/**
 * @type {Readonly<Record<String, ThemeOptionField>>}
 */
export const ThemeOptionFields = ObjectUtils.deepFreeze({
  /* Gradients */
  colorBackgroundPrimary: { label: "AH.THEME.BackgroundPrimary", type: "text" },
  colorPrimary: { label: "AH.THEME.ForegroundPrimary", type: "color" },
  colorBackgroundSurface: { label: "AH.THEME.BackgroundSurface", type: "text" },
  colorSurface: { label: "AH.THEME.ForegroundSurface", type: "color" },
  colorBackgroundOverlay: { label: "AH.THEME.BackgroundOverlay", type: "text" },

  /* Application */
  backgroundInput: { label: "AH.THEME.BackgroundInput", type: "color" },
  backgroundApplicationHeader: { label: "AH.THEME.BackgroundApplicationHeader", type: "text" },
  backgroundImageApplication: { label: "AH.THEME.BackgroundImageApplication", type: "image" },
  backgroundBlendModeApplication: { label: "AH.THEME.BackgroundBlendModeApplication", type: "text", default: "overlay;" },
  backgroundSizeApplication: { label: "AH.THEME.BackgroundSizeApplication", type: "text", default: "100% auto;" },

  /* Sidebar */
  backgroundImageSidebar: { label: "AH.THEME.BackgroundImageSidebar", type: "image" },

  /* Custom */
  custom: {
    label: "AH.THEME.Custom",
    type: "multiline-text",
  },
});

/**
 * @desc A global UI theme that can be applied to the current world.
 * @implements ThemeOptions
 */
export default class Theme {
  /**
	 * Creates a Theme instance.
	 * @param {ThemeOptions} data The data to construct the Theme from.
	 */
  constructor(data = {}) {
    Object.keys(data).forEach((key) => {
      this[key] = data[key];
    });
  }

  /**
	 * @param {Partial<ThemeOptions>} options
	 * @returns {Record<string, string>}
	 */
  static themeOptionsToCSSVars(options) {
    return Object.fromEntries(Object.entries(options).map(([key, value]) => [StringUtils.camelToKebab(key), value]));
  }

  /**
   * @param {String} key
   * @param {ThemeOptionField} field
   */
  static fromOptionToCSSVariable(key, field) {
    if (field?.variable) {
      return field.variable;
    }
    return `--ah-${StringUtils.camelToKebab(key)}`;
  }

  // TODO: Iterate over the option field keys instead?
  /**
	 * @desc Applies this theme to the game world.
	 * @return {Promise}
	 */
  async apply() {
    const head = document.head;
    const id = `${systemID}-themes`;
    let style = head.querySelector(`style#${id}`);
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      head.appendChild(style);
      head.insertBefore(document.createComment(` ${systemID} themes`), style);
    }

    const properties = Object.keys(this).filter((key) => key !== "custom");
    const styleData = properties
      .map((themeKey) => {
        /** @type ThemeOptionField **/
        const themeField = ThemeOptionFields[themeKey];
        const fieldType = themeField?.type;
        let fieldValue = this[themeKey];

        if ((fieldValue === undefined) && themeField.default) {
          fieldValue = themeField.default;
        }

        if (fieldType === "image") {
          if (!fieldValue) {
            fieldValue = "url(\"\")";
          } else {
            try {
              const isRelativeUrl = new URL(document.baseURI).origin === new URL(fieldValue, document.baseURI).origin;
              const prefix = isRelativeUrl ? "/" : "";
              fieldValue = `url("${prefix}${fieldValue}")`;
            } catch (e) {
              console.error(e);
              fieldValue = "url(\"\")";
            }
          }
        }

        if (!fieldValue || (typeof fieldValue !== "string")) {
          return;
        }
        const cssVar = Theme.fromOptionToCSSVariable(themeKey, themeField);
        return `${cssVar}: ${fieldValue};`;
      })
      .filter(Boolean)
      .join("\n\t");

    let styleContent = `:root {\n\t${styleData}\n}`;
    if (this.custom) {
      styleContent += `\n\n${this.custom}`;
    }
    style.textContent = styleContent;

    console.info("The selected theme has been applied.");
  }

  /**
	 * @desc Downloads a json file of containing this theme's data.
	 */
  exportToJson = function () {
    const data = JSON.stringify(foundry.utils.duplicate(this), null, 2);
    const filename = `${systemID}-theme.json`;
    const blob = new Blob([data], { type: "text/json" });

    // Create an element to trigger the download
    let a = document.createElement("a");
    a.href = window.URL.createObjectURL(blob);
    a.download = filename;

    // Dispatch a click event to the element
    a.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
    setTimeout(() => window.URL.revokeObjectURL(a.href), 100);
  };

  /**
	 * @desc Generates a Theme from a passed in json string.
	 * @param {string} json A json string containing the Theme data.
	 * @returns {Theme} The generated Theme.
	 */
  static async fromJSON(json) {
    const data = JSON.parse(json);
    return new Theme(data);
  }
}
