import { receiveSocketEvent, sendSocketEvent } from "../constants.mjs";
import AH from "../config.mjs";

const ANIMATION_PRESETS = {
  // Centered, moderate size
  center: { width: "40vmin", height: "40vmin", top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  // Smaller, centered
  small: { width: "25vmin", height: "25vmin", top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  // Large, for jackpots / legendary
  large: { width: "70vmin", height: "70vmin", top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
  // Lower-center, like a chest sitting near the bottom of the screen
  bottom: { width: "35vmin", height: "35vmin", bottom: "10%", left: "50%", transform: "translateX(-50%)" },
  // Corner badge, least intrusive
  corner: { width: "20vmin", height: "20vmin", bottom: "2rem", right: "calc(var(--sidebar-width, 300px) + 2rem)" },
  // Fixed pixel size
  fixed: { width: "320px", height: "320px", top: "50%", left: "50%", transform: "translate(-50%, -50%)" },
};

/**
 * @typedef VideoOverlayOptions
 * @property {String} src Formats: webm
 * @property {'center'|'fixed'|'small'|'large'|'corner'} preset
 */

/**
 * @param {VideoOverlayOptions} options
 * @returns {Promise<unknown>}
 */
function playVideo(options) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    Object.assign(video.style, {
      position: "fixed",
      objectFit: "contain",
      pointerEvents: "none",
      zIndex: 10000,
      ...ANIMATION_PRESETS[options.preset ?? "center"],
    });
    video.src = options.src;
    video.muted = true; // required for autoplay
    video.playsInline = true;
    video.addEventListener("ended", () => { video.remove(); resolve(); });
    video.addEventListener("error", () => { video.remove(); resolve(); });
    document.body.append(video);
    return video.play();
  });
}

/**
 * @param {VideoOverlayOptions} options
 * @returns {Promise<unknown>}
 */
async function broadcastVideo(options) {
  await playVideo(options);
  sendSocketEvent(AH.sockets.OVERLAY_PLAY_VIDEO, options);
}

/**
 * Initializes the callback handlers for this pipeline.
 */
function initialize() {
  receiveSocketEvent(AH.sockets.OVERLAY_PLAY_VIDEO, playVideo);
}

export const Overlay = Object.freeze({
  playVideo,
  broadcastVideo,
  initialize,
});
