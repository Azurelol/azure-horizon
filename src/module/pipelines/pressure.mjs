
import AH from "../config.mjs";
import { SourceInfo } from "../data/common/_module.mjs";
import { AsyncHooks, ChatMessageBuilder } from "../helpers/_module.mjs";
import { renderTemplate } from "../constants.mjs";
import Tracks from "./tracks.mjs";

/**
 * @typedef PressureData
 * @property {String[]} affinities
 * @property {Boolean} trait If the damaging action added additional pressure.
 */

/**
 * @typedef PressureProcessResult
 * @property {Boolean} staggered
 * @property {String} content To be rendered in the chat damage message.
 */

/**
 * @param {DamageContext} context
 * @return {PressureProcessResult}
 */
async function process(context) {
  if (context.subject.type !== "adversary") {
    return null;
  }

  // Resolve the pressure effect on the actor
  let pressureEffect = context.subject.resolveEffect("pressure");
  if (!pressureEffect) {
    return null;
  }

  // If this NPC is pressured because they are VU to the damage type,
  // AND the amount of HP loss is equal to or higher than 10 + half their level,
  // fill the clock by 2
  let increase = 1;
  if (context.result.total >= 10 + Math.floor(context.subject.system.level / 2)) {
    increase += 1;
  }
  await pressureEffect.update({
    ["system.tracker.current"]: pressureEffect.system.tracker.current + increase,
  });

  let staggered = false;
  // If now at max, apply stagger
  if (pressureEffect.system.tracker.isMaximum) {
    await context.subject.toggleStatusEffect("stagger", SourceInfo.scene);
    const stagger = context.subject.resolveEffect("stagger");
    if (stagger) {
      staggered = true;
    }
  }
  const content = await Tracks.renderDetails(pressureEffect.system.tracker, null, true);
  return {
    content,
    staggered,
  };
}

/**
 * @param {DamageContext} context
 * @returns {Promise<void>}
 */
async function createStaggerChatMessage(context) {
  let builder = new ChatMessageBuilder(context.actor, context.item);
  let content = await renderTemplate("chat/chat-stagger-message", {
    sourceActor: context.sourceActor,
    actor: context.actor,
  });
  builder.text(content);
  return builder.create();
}

const PRESSURE_MAX_INCREASE = 4;

/**
 * @param {AHActor[]} actors
 * @returns {Promise<void>}
 */
async function initializeActors(actors) {
  console.debug("Initialzing pressure for adversaries");
  for (const actor of actors.filter((a) => a.type === "adversary")) {

    // Add pressure effect
    await Pressure.applyPressureEffect(actor);

    // Remove stagger
    const stagger = actor.resolveEffect("stagger");
    if (stagger) {
      stagger.delete();
      const lookup = actor.resolveTracker("pressure");
      lookup.document.update({
        current: 0,
        max: lookup.tracker.max + PRESSURE_MAX_INCREASE,
      });
    }
  }

}

/**
 * @param {AHCombat} combat
 * @param {CombatUpdateData} updateData
 * @param updateOptions
 */
function onCombatStart(combat, updateData, updateOptions) {
  const actors = combat.actors;
  initializeActors(actors);
}

/**
 * @param {AHCombat} combat
 * @param {CombatUpdateData} updateData
 * @param updateOptions
 */
function onRoundChange(combat, updateData, updateOptions) {
  const actors = combat.actors;

}

/**
 * @param {CombatEvent} event
 * @returns {Promise<void>}
 */
async function onCombatEvent(event) {
  switch (event.type) {
    case "startOfCombat":
      break;
    case "endOfCombat":
      for (const actor of event.actors.filter((a) => a.type === "adversary")) {
        await removePressureEffect(actor);
      }
      break;
  }
}

/**
 * @param {AHActor} actor
 * @returns {Promise<void>}
 */
async function applyPressureEffect(actor) {
  /** @type AdversaryProfileDataModel **/
  const profile = actor.system.profile;
  const rank = profile.rank;
  switch (rank) {
    case "champion":
    case "elite":
      {
      // If they somehow already have the pressure effect
        const pressure = actor.resolveEffect("pressure");
        if (pressure) {
          await pressure.delete();
        }
        // TODO: Increase if setting after a stagger
        // Toggle it on
        const segments = rank === "champion" ? 2 + profile.turns * 2 : 4;
        const updates = {
          ["system.tracker.max"]: segments,
        };
        await actor.createStatusEffect("pressure", SourceInfo.scene, {
          updates: updates,
        });
      }
      break;

    default:
      break;
  }
}

/**
 * @param {AHActor} actor
 * @returns {Promise<void>}
 */
async function removePressureEffect(actor) {
  const rank = actor.system.profile.rank;
  switch (rank) {
    case "champion":
    case "elite":
      {
        const pi = actor.resolveEffect("pressure");
        if (pi) {
          pi.delete();
        }
        const stagger = actor.resolveEffect("stagger");
        if (stagger) {
          stagger.delete();
        }
      }
      break;

    default:
      break;
  }
}

function initialize() {
  Hooks.on(AH.hooks.foundry.combat.combatStart, onCombatStart);
  Hooks.on(AH.hooks.foundry.combat.combatRound, onRoundChange);
  AsyncHooks.on(AH.hooks.COMBAT_EVENT, onCombatEvent);
}

const Pressure = Object.freeze({
  initialize,
  process,
  applyPressureEffect,
  removePressureEffect,
  createStaggerChatMessage,
});

export default Pressure;
