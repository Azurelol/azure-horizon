import AH from "../config.mjs";
import Expressions from "../pipelines/expressions.mjs";
import { StringUtils } from "../utils/_module.mjs";

export default class TextEditorHelper {

  /**
   * @type {string} The pattern used for optional labeling
   */
  static labelPattern = "(\\{(?<label>.*?)\\})?";

  /**
   * @type {string} The pattern used for optional traits
   */
  static traitsPattern = "(\\|(?<traits>[a-zA-Z-,]+)\\|)?";

  // TODO: Use a JSON map to then convert to a pattern?

  /**
   * @param {String} name The name of the command
   * @param {String} required
   * @param {String[]|null} optional
   * @returns {RegExp} A regex to be used within an enricher
   * @remarks Expects regex sub-patterns to be already escaped
   * @remarks Automatically adds support for the following groups: `label` (String), `traits` (String[]).
   */
  static pattern(name, required, optional = undefined) {
    const joinedOptional = optional ? optional.join("") : "";
    const pattern = `@${name}\\[${required}${joinedOptional}${TextEditorHelper.traitsPattern}\\]${TextEditorHelper.labelPattern}`;
    return new RegExp(pattern, "g");
  }

  /**
   * @returns {HTMLAnchorElement}
   */
  static anchor() {
    const anchor = document.createElement("a");
    anchor.classList.add("ah-inline");
    return anchor;
  }

  /**
   * @param {HTMLAnchorElement} anchor
   * @param {String} name
   *
   */
  static icon(anchor, name) {
    const className = AH.icons[name];
    if (className) {
      const icon = document.createElement("i");
      icon.classList.add("ah-icon --xs", className);
      anchor.append(icon);
      return icon;
    }
  }

  /**
   * @param {HTMLAnchorElement} anchor
   * @param {String} amount
   */
  static amount(anchor, amount) {
    anchor.dataset.amount = amount;
    const dynamicAmount = Expressions.requiresContext(amount);
    if (dynamicAmount) {
      anchor.append(StringUtils.localize("AH.COMMON.Variable"));
    } else {
      anchor.append(amount);
    }
  }
}
