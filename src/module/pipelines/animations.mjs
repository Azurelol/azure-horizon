import { AsyncHooks } from "../helpers/_module.mjs";
import AH from "../config.mjs";

async function onPerformAction(event) {

}

/**
 * Initialize callbacks.
 */
function initialize() {
  AsyncHooks.on(AH.hooks.PERFORM_ACTION_EVENT, onPerformAction);
}

const Animations = Object.freeze({
  initialize,
});

export default Animations;
