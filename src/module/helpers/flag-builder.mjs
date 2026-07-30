import { systemID } from "../constants.mjs";

/**
 * Used for manipulating Document flags.
 */
export default class FlagBuilder {

  #flags;

  constructor(flags = {}) {
    this.#flags = flags ?? { [systemID]: {} };
  }

  /**
   * @param {String} key
   * @param {*} value
   * @return {FlagBuilder}
   */
  set(key, value) {
    (this.#flags[systemID] ??= {})[key] ??= value;
    return this;
  }

  /**
   * @param {String} key
   * @return {FlagBuilder}
   */
  toggle(key) {
    this.set(key, true);
  }

  /**
   * @returns {Record}
   * @return {Object}
   */
  toObject() {
    return this.#flags;
  }

}
