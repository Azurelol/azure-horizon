import { ObjectUtils } from "../utils/_module.mjs";

/**
 * @param {String|String[]} src
 * @param {Boolean} broadcast
 * @returns {Promise<void>}
 */
async function playInterface(src, broadcast = true) {
  await foundry.audio.AudioHelper.play({
    src: ObjectUtils.randomArrayElement(src),
    volume: 0.8,
    loop: false,
    channel: "interface",
  }, broadcast);
}

export const Sounds = Object.freeze({
  playInterface,
});
