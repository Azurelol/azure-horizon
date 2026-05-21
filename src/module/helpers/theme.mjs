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
 */

/**
 * @type {Readonly<Record<String, ThemeOptionField>>}
 */
export const ThemeOptionFields = ObjectUtils.deepFreeze({

  /* Images */
  uiAccentImage: { label: "FU.UiAccentImageLabel", type: "image" },
  appAccentImage: { label: "FU.AppAccentImageLabel", type: "image" },
  appBgImage: { label: "FU.AppBgImageLabel", type: "image" },
  appBgBlendMode: { label: "FU.AppBgBlendModeLabel", type: "text", default: "overlay;" },
  appBgSize: { label: "FU.AppBgSizeLabel", type: "text", default: "100% auto;" },
  appSectionBgImage: { label: "FU.AppSectionBgImageLabel", type: "image" },
  sidebarBgImage: { label: "FU.SidebarBgImageLabel", type: "image" },

  /* Advanced */
  advanced: {
    label: "FU.AdvancedLabel",
    hint: "FU.AdvancedHint",
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
   * @desc Convenient factory method for getting a Theme instance from passed in data.
   * @param {*} themeData
   * @returns {Theme} The passed in themeData if it was already an instance of Theme, or a Theme generated from the themeData.
   */
  static from(themeData) {
    return themeData instanceof Theme ? themeData : new Theme(themeData);
  }

  // TODO: Iterate over te option field keys instead?
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
      head.insertBefore(document.createComment(" ProjectFU Themes "), style);
    }

    const properties = Object.keys(this).filter((key) => key !== "advanced");
    const styleData = properties
      .map((themeKey) => {
        const themeField = ThemeOptionFields[themeKey];
        const themeType = themeField?.type;
        let themeValue = this[themeKey];
        if ((themeValue === undefined) && themeField.default) {
          themeValue = themeField.default;
        }

        if (themeType === "image") {
          if (!themeValue) {
            themeValue = "url(\"\")";
          } else {
            try {
              const isRelativeUrl = new URL(document.baseURI).origin === new URL(themeValue, document.baseURI).origin;
              const prefix = isRelativeUrl ? "/" : "";
              themeValue = `url("${prefix}${themeValue}")`;
            } catch (e) {
              console.error(e);
              themeValue = "url(\"\")";
            }
          }
        } else if (!themeValue || (typeof themeValue !== "string")) {
          return;
        }
        const cssKey = StringUtils.camelToKebab(themeKey);
        return `--pfu-${cssKey}: ${themeValue};`;
      })
      .filter(Boolean)
      .join("\n\t");

    let styleContent = `:root {\n\t${styleData}\n}`;
    if (this.advanced) {
      styleContent += `\n\n${this.advanced}`;
    }

    style.textContent = styleContent;

    if (!document.querySelector("#ui-left #ui-accent")) {
      document.querySelector("#ui-left")?.insertAdjacentHTML("afterbegin", "<div id=\"ui-accent\"></div>");
    }

    console.info("The selected theme has been applied.");
  }

  /**
   * @desc Downloads a json file of containing this theme's data.
   */
  exportToJson = function() {
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
