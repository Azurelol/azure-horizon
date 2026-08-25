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

  /**
   * Attempts to resolve the sign of a single modifier amount without
   * fully evaluating dice terms.
   * @param {String|Number} amount
   * @returns {1|0|-1}
   * @remark Best-effort. Static expressions (no dice) resolve exactly.
   *   Expressions containing dice terms fall back to reading the
   *   leading operator, since dice can't roll negative.
   */
  static resolveSign(amount) {
    if (typeof amount === "number") {
      return Math.sign(amount);
    }

    const trimmed = String(amount ?? "").trim();
    if (!trimmed) return 0;

    // Plain integer/decimal string
    const asNumber = Number(trimmed);
    if (!Number.isNaN(asNumber)) {
      return Math.sign(asNumber);
    }

    // Static (dice-free) expression — safe to fully evaluate
    if (!/d\d*/i.test(trimmed)) {
      try {
        const evaluated = Roll.safeEval(trimmed);
        return Math.sign(evaluated);
      } catch {
        // fall through to heuristic below
      }
    }

    // Expression contains dice terms — dice never roll negative,
    // so the sign is determined by the leading operator.
    return trimmed.startsWith("-") ? -1 : 1;
  }

  /**
   * Pick a random index from an array of weights, proportional to their values.
   * @param {number[]} weights - non-negative weights (need not sum to 1)
   * @returns {number} the chosen index, or -1 if weights is empty or all-zero
   */
  static weightedRandomIndex(weights) {
    const total = weights.reduce((sum, w) => sum + w, 0);
    if (total <= 0) return -1;

    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      roll -= weights[i];
      if (roll < 0) return i;
    }
    return weights.length - 1;
  }
}
