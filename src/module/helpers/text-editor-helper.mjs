/**
 * @type {string} The pattern used for optional labeling
 */
const labelPattern = "(\\{(?<label>.*?)\\})?";

/**
 * @type {string} The pattern used for optional traits
 */
const traitsPattern = "(\\|(?<traits>[a-zA-Z-,]+)\\|)?";

export default class TextEditorEnricher {

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
    const pattern = `@${name}\\[${required}${joinedOptional}${traitsPattern}\\]${labelPattern}`;
    return new RegExp(pattern, "g");
  }
}
