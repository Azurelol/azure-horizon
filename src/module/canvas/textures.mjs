import { systemAssetPath } from "../constants.mjs";

const BAR_TEXTURES = {};

async function preload() {
  BAR_TEXTURES.hpFrame = await loadTexture(systemAssetPath("ui//bars/bar-hp-frame.png"));
  BAR_TEXTURES.hpFill = await loadTexture(systemAssetPath("ui//bars/bar-hp-fill.png"));

  BAR_TEXTURES.hpPartyFrame = await loadTexture(systemAssetPath("ui//bars/bar-hp-party-frame.png"));
  BAR_TEXTURES.hpPartyFill = await loadTexture(systemAssetPath("ui//bars/bar-hp-party-fill.png"));

  BAR_TEXTURES.pressureFill = await loadTexture(systemAssetPath("ui//bars/bar-pressure-fill.png"));
  BAR_TEXTURES.pressureFrame = await loadTexture(systemAssetPath("ui//bars/bar-pressure-frame.png"));
}

function get(key) {
  return BAR_TEXTURES[key];
}

export const AHTextures = Object.freeze({
  get,
  preload,
});
