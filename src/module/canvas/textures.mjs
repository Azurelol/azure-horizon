import { systemAssetPath } from "../constants.mjs";

const _TEXTURES = {};

async function preload() {
  _TEXTURES.hpFrame = await loadTexture(systemAssetPath("ui/bars/bar-hp-frame.png"));
  _TEXTURES.hpFill = await loadTexture(systemAssetPath("ui//bars/bar-hp-fill.png"));

  _TEXTURES.hpPartyFrame = await loadTexture(systemAssetPath("ui/bars/bar-hp-party-frame.png"));
  _TEXTURES.hpPartyFill = await loadTexture(systemAssetPath("ui//bars/bar-hp-party-fill.png"));

  _TEXTURES.pressureFill = await loadTexture(systemAssetPath("ui/bars/bar-pressure-fill.png"));
  _TEXTURES.pressureFrame = await loadTexture(systemAssetPath("ui/bars/bar-pressure-frame.png"));

  _TEXTURES.markImage = await loadTexture(systemAssetPath("tiles/mark.png"));
}

function get(key) {
  return _TEXTURES[key];
}

export const AHTextures = Object.freeze({
  get,
  preload,
});
