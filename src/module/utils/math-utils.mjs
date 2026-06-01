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
   * @param {number} number
   * @return {boolean}
   */
  static isEven(number) {
    return number % 2 === 0;
  }
}
