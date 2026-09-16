import { systemID } from "../constants.mjs";
import { Database } from "./database.mjs";
import AH from "../config.mjs";
import { AsyncHooks } from "../helpers/_module.mjs";
import { Sequences } from "./sequences.mjs";

/**
 * @description Subscribes to the system combat events
 */
function subscribe() {
  if (!game.modules.get("sequencer")?.active) {
    console.debug("Sequencer not installed and active!");
    return;
  }

  AsyncHooks.on(AH.hooks.PERFORM_ACTION_EVENT, Sequences.animateAction);
  AsyncHooks.on(AH.hooks.APPLY_DAMAGE_EVENT, Sequences.animateDamage);
}

function initialize() {
  Hooks.on("sequencerReady", () => {
    Sequencer.Database.registerEntries(
      systemID,
      Database.entries,
    );
    subscribe();
  });
}

export const FX = Object.freeze({
  initialize,
});
