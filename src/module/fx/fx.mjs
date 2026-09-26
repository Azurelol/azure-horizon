import { systemID } from "../constants.mjs";
import { Database } from "./database.mjs";
import AH from "../config.mjs";
import { AsyncHooks } from "../helpers/_module.mjs";
import { Sequences } from "./sequences.mjs";
import { StringUtils } from "../utils/_module.mjs";
import { Canvas } from "../canvas/_module.mjs";
import { Sounds } from "./sounds.mjs";

const { Graphics } = PIXI;
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
  Hooks.on(AH.hooks.INITIATIVE, (data) => {
    Sounds.playInterface(Database.entries.sfx.ui.combat.initiative);
    Canvas.ScrollingText({
      origin: Canvas.center,
      content: StringUtils.localize("AH.COMBAT.InitiativeRoll", {
        round: data.round,
      }),
      options: {
        duration: 3000,
        anchor: Canvas.textAnchorPoints.CENTER,
        textStyle:
          {
            fontFamily: "Pixeloid",
            fontSize: 32,
            stroke: "#000000",
            strokeThickness: 5,
            dropShadow: {
              color: "#000000",
              blur: 5,
              distance: 4,
              angle: Math.PI / 4,
              alpha: 0.5,
            },
          },
      },
    });
  },
  );
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
