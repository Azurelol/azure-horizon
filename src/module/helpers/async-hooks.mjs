/**
 * @desc A simple async/await–aware hook system.
 * @remarks Not to be mixed with Foundry's default {@code Hooks} API.
 * @example
 *   AsyncHooks.on("myHook", async (data) => { ... });
 *   await AsyncHooks.call("myHook", { foo: "bar" });
 */
export default class AsyncHooks {
  static #hooks = new Map();

  /**
	 * Register a callback for a hook.
	 * @param {string} hook
	 * @param {Function} fn
	 */
  static on(hook, fn) {
    if (!this.#hooks.has(hook)) {
      this.#hooks.set(hook, new Set());
    }
    this.#hooks.get(hook).add(fn);
  }

  /**
	 * Remove a previously registered hook.
	 * @param {string} hook
	 * @param {Function} fn
	 */
  static off(hook, fn) {
    this.#hooks.get(hook)?.delete(fn);
  }

  /**
	 * Call all handlers in parallel.
	 * Returns an array of results.
	 * @param {string} hook
	 * @param  {...any} args
	 */
  static async call(hook, ...args) {
    const handlers = this.#hooks.get(hook);
    if (!handlers) return [];

    const promises = [];

    for (const fn of handlers) {
      try {
        const result = fn(...args);
        promises.push(Promise.resolve(result));
      } catch (err) {
        // Catch sync errors and convert them into rejected Promises.
        promises.push(Promise.reject(err));
      }
    }

    return Promise.all(promises);
  }

  /**
	 * Call hook handlers sequentially.
	 * Guaranteed order.
	 * @param {string} hook
	 * @param  {...any} args
	 */
  static async callSequential(hook, ...args) {
    const handlers = this.#hooks.get(hook);
    if (!handlers) return [];

    const results = [];

    for (const fn of handlers) {
      try {
        const result = await fn(...args);
        results.push(result);
      } catch (err) {
        // You can choose to stop here or continue
        results.push(Promise.reject(err));
      }
    }

    return results;
  }

  /**
   * @template {any[]} Args
   * @callback HookCallback
   * @param {...Args} args
   * @returns {Promise<void>|void}
   */

  /**
   * @template {any[]} Args
   * @param {String} hook The name of the hook
   * @param {...Args} args Arguments passed to both the hook and each registered callback
   * @returns {Promise<void>}
   */
  static async invokeWithCallbacks(hook, ...args) {
    const callbacks = [];

    Hooks.callAll(hook, ...args, (callback, priority = 0) => {
      callbacks.push({ callback, priority });
    });

    callbacks.sort((a, b) => a.priority - b.priority);

    for (const { callback } of callbacks) {
      await callback(...args);
    }
  }
}
