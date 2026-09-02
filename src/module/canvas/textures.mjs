import { systemAssetPath } from "../constants.mjs";

const BAR_TEXTURES = {};

async function preload() {
  BAR_TEXTURES.frame = await loadTexture(systemAssetPath("ui//bars/bar-frame.png"));
  BAR_TEXTURES.fill = await loadTexture(systemAssetPath("ui//bars/bar-fill.png"));
}

export function get(key) {
  return BAR_TEXTURES[key];
}

export const AHTextures = Object.freeze({
  get,
  preload,
});
