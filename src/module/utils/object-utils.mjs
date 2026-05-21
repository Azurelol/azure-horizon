export default class ObjectUtils {
  /**
   * @param {Object} target
   * @param {Object} source
   * @returns {(Object|boolean)[]}
   * @remarks If you don't care about whether it was changed, you can ignore the result.
   */
  static mergeRecursive(target, source) {
    let changed = false;

    for (const [key, value] of Object.entries(source)) {
      if ((typeof value === "object") && (value !== null) && !Array.isArray(value)) {
        if (!(key in target)) {
          target[key] = {};
          changed = true;
        }

        const [nestedTarget, nestedChanged] = ObjectUtils.mergeRecursive(target[key], value);
        target[key] = nestedTarget;
        if (nestedChanged) changed = true;
      } else if (!(key in target) || (target[key] !== value)) {
        target[key] = value;
        changed = true;
      }
    }

    return [target, changed];
  }

  /**
   * @param {Object} obj The object to resolve the property from.
   * @param {String} path The path to the property, in dot notation.
   * @returns {undefined|*} The value of the property.
   */
  static getProperty(obj, path) {
    return foundry.utils.getProperty(obj, path);
  }

  /**
   * @param {Object} obj The object to set the property on.
   * @param {String} path The path to the property, in dot notation.
   * @param {*} value The value to set on the property.
   */
  static setProperty(obj, path, value) {
    return foundry.utils.setProperty(obj, path, value);
  }

  /**
   *
   * @param {Object} obj
   * @returns {Object} An object without any undefined properties.
   */
  static cleanObject(obj) {
    return Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));
  }

  /**
   * @description Given a record, will return an object with a subset of its key-value pairs.
   * @param {Record} record
   * @param {String[]} keys
   * @returns {{[p: string]: any}}
   */
  static pick(record, keys) {
    return Object.fromEntries(keys.filter((key) => key in record).map((key) => [key, record[key]]));
  }

  /**
   * Recursive version of Object.freeze.
   * @param {object} obj The object to freeze.
   * @returns {object} The object that was passed in, now deep frozen.
   */
  static deepFreeze(obj) {
    Object.keys(obj).forEach((property) => {
      if ((typeof obj[property] === "object") && (obj[property] !== null) && !Object.isFrozen(obj[property])) {
        ObjectUtils.deepFreeze(obj[property]);
      }
    });
    return Object.freeze(obj);
  }

  /**
   * @param {Object[]} array
   * @param {String} property
   * @returns {*[]}
   */
  static sortArray(array, property) {
    return [...array].sort((a, b) => (a[property] > b[property] ? 1 : -1));
  }
}
