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
   */
  set(key, value) {
    (this.#flags[systemID] ??= {})[key] ??= value;
    return this;
  }

  /**
   * @param {String} key
   */
  toggle(key) {
    this.set(key, true);
  }

  /**
   * @returns {Record}
   */
  toObject() {
    return this.#flags;
  }

}
