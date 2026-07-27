// DSL supported by the inline amount expression
const referenceSymbol = "@";
const itemLabel = "item";
const redirectSymbol = "~";

export default class Expressions {
  /**
   * @param expression The raw text of the amount
   * @returns {boolean} True if the expression requires a context to be evaluated
   */
  static requiresContext(expression) {
    return !Number.isInteger(Number(expression));
  }
}
