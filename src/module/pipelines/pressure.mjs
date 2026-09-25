
import AH from "../config.mjs";
import { SourceInfo } from "../data/common/_module.mjs";
import { AsyncHooks, ChatMessageBuilder } from "../helpers/_module.mjs";
import { renderTemplate } from "../constants.mjs";

/**
 * @typedef PressureData
 * @property {String[]} affinities
 * @property {Boolean} trait If the damaging action added additional pressure.
 * @property {Boolean} major Whether significant pressure was applied.
 * @property {Boolean} valid
 * @property {String} message
 */

/**
 * @typedef {PressureData} PressureProcessResult
 * @property {AHActiveEffect} effect
 * @property {Boolean} staggered
 */

/**
 * @param {DamageContext} context
 * @return {Promise<PressureProcessResult>}
 */
async function process(context) {
  if (context.subject.type !== "adversary" || !context.subject.system.ranked) {
    return null;
  }

  // If this NPC is pressured because they are VU to the damage type
  let increase = 1;
  if (context.pressure.affinities.length > 0) {
    increase += 1;
  }
  // // If they took more than 1/4 of their HP in damage
  // if (context.result.total >= context.subject.resources.hp.quarter) {
  //   increase += 1;
  // }
  // If there was a trait, also increase
  if (context.pressure.trait) {
    increase += 1;
  }

  // Update pressure
  await context.subject.modifyTokenAttribute("resources.pp", increase, true);
  /** @type ActorResourceDataModel **/
  const pressure = context.subject.system.resources.pp;

  // If now at max, apply stagger
  let staggered = false;
  if (pressure.full) {
    await context.subject.toggleStatusEffect("stagger", SourceInfo.scene);
    const stagger = context.subject.resolveEffect("stagger");
    if (stagger) {
      staggered = true;
    }
  }

  return {
    ...context.pressure,
    resource: pressure,
    staggered: staggered,
  };
}

/**
 * @param {DamageContext} context
 * @returns {Promise<void>}
 */
async function createStaggerChatMessage(context) {
  let builder = new ChatMessageBuilder(context.actor, context.item);
  let content = await renderTemplate("chat/chat-stagger-message", {
    sourceActor: context.actor,
    actor: context.subject,
  });
  builder.text(content);
  return builder.create();
}

/**
 * @param {AHActor[]} actors
 * @returns {Promise<void>}
 */
async function initializeActors(actors) {
  console.debug("Initialzing pressure for adversaries");
  for (const actor of actors.filter((a) => a.type === "adversary")) {

    // Reset pressure
    await actor.update({
      ["system.resources.pp.value"]: 0,
    });

    // Remove stagger
    const stagger = actor.resolveEffect("stagger");
    if (stagger) {
      stagger.delete();
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
    case "endOfRound":
      for (const actor of event.actors.filter((a) => a.type === "adversary")) {
        const stagger = actor.resolveEffect("stagger");
        if (stagger) {
          stagger.delete();
          await actor.toggleStatusEffect("staggerResistance");
          await actor.modifyTokenAttribute("resources.pp", 0, false);
        }
      }
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
        await actor.update({
          ["system.resources.pp.value"]: 0,
        });

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
  createStaggerChatMessage,
});

export default Pressure;
