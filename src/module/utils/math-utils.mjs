export default class MathUtils {
  /**
   * @param {Number} value
   * @param {Number} min
   * @param {Number} max
   * @returns {number}
   */
  static clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
  }

  /**
   * @description A sandbox-safe evaluation function to execute user-input code with access to scoped Math methods.
   * @param {String} expression A simple arithmetic expression
   * @returns {Number} The evaluated value
   * @author Uses Foundry's API
   * @remarks Uses {@link https://foundryvtt.com/api/classes/foundry.dice.Roll.html#roll}
   */
  static evaluate(expression) {
    try {
      return Roll.safeEval(expression);
    } catch (e) {
      return expression;
    }
  }

  /**
   * @param {number} number
   * @return {boolean}
   */
  static isEven(number) {
    return number % 2 === 0;
  }
}
