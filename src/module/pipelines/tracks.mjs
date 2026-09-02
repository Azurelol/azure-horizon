/**
 * @typedef TrackUpdateOptions
 * @property {AHActor|AHItem} source
 */

import { ObjectUtils, StringUtils } from "../utils/_module.mjs";
import MathHelper from "../utils/math-utils.mjs";
import Events from "./events.mjs";
import { renderTemplate } from "../constants.mjs";

/**
 * @description Updates a progress track at an index
 * @param {Document} document
 * @param {String} propertyPath
 * @param {number} index The index of the progress track
 * @param {number} increment
 * @param {TrackUpdateOptions} options
 */
async function updateAtIndexForDocument(document, propertyPath, index, increment, options = undefined) {
  if (index === undefined) {
    throw Error("Undefined index reference was given");
  }
  const property = ObjectUtils.getProperty(document, propertyPath);
  /** @type TrackerDataModel[] **/
  const tracks = ObjectUtils.duplicate(property);
  const track = tracks[index];
  if (track) {
    track.current = MathHelper.clamp(track.current + increment * track.step, 0, track.max);
    document.update({ [propertyPath]: tracks });
    if (options) {
      await notifyUpdate(document, track, increment, options.source);
    }
  } else {
    ui.notifications.error(`Failed to update progress track for ${document.name}`);
  }
}

/**
 * @param {Document} document
 * @param {String} propertyPath
 * @param {Number} increment
 * @param {Boolean} useMultiplier
 * @returns {Promise<void>}
 */
async function updateForDocument(document, propertyPath, increment, useMultiplier) {
  /** @type TrackerDataModel **/
  const tracker = ObjectUtils.getProperty(document, propertyPath);
  const updatedValue = tracker.calculateUpdatedValue(increment, useMultiplier);
  const currentPropertyPath = `${propertyPath}.current`;
  await document.update({ [currentPropertyPath]: updatedValue });
}

/**
 * @param {Document} document
 * @param {TrackerDataModel} progress
 * @param {Number} increment
 * @param {AHActor|AHItem|String} source
 * @returns {Promise}
 */
async function notifyUpdate(document, progress, increment, source) {
  Events.track(document, progress, "update", increment, source);
  const message = StringUtils.localize(increment > 0 ? "AH.CHAT.TrackIncrement" : "AH.CHAT.TrackDecrement", {
    clock: progress.name ?? progress.parent.parent.name,
    source: source?.name ?? source ?? StringUtils.localize("AH.COMMON.Unknown"),
    step: increment,
  });
  return sendToChat(document, progress, message);
}

/**
 * @param {AHActor|AHItem|Document} actor
 * @param {TrackerDataModel} track
 * @param {String} message
 * @returns {Promise<void>}
 */
async function sendToChat(actor, track, message = undefined) {
  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actor }),
    content: await renderDetails(track, message),
  });
}

/**
 * @param {TrackerDataModel} tracker
 * @param {String} message
 * @param {Boolean} displayName
 * @param {String} img
 * @returns {Promise<String>}
 */
async function renderDetails(tracker, message = undefined, displayName = true, img = undefined) {
  return renderTemplate("chat/chat-tracker-details", {
    tracker: tracker,
    segments: tracker.segments,
    message: message,
    img: img,
    displayName: displayName,
  });
}

const Tracks = Object.freeze({
  updateAtIndexForDocument,
  updateForDocument,
  sendToChat,
  renderDetails,
});

export default Tracks;
