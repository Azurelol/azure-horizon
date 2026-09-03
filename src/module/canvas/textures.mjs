import { systemAssetPath } from "../constants.mjs";

const BAR_TEXTURES = {};

async function preload() {
  BAR_TEXTURES.frame = await loadTexture(systemAssetPath("ui//bars/bar-frame.png"));
  BAR_TEXTURES.fill = await loadTexture(systemAssetPath("ui//bars/bar-fill.png"));
  BAR_TEXTURES.yellowFill = await loadTexture(systemAssetPath("ui//bars/bar-yellow-fill.png"));
  BAR_TEXTURES.yellowFrame = await loadTexture(systemAssetPath("ui//bars/bar-yellow-frame.png"));

  BAR_TEXTURES.yellowFill = await loadTexture(systemAssetPath("ui//bars/bar-yellow-fill.png"));
  BAR_TEXTURES.redFill = await loadTexture(systemAssetPath("ui//bars/bar-red-fill.png"));
  BAR_TEXTURES.greenFill = await loadTexture(systemAssetPath("ui//bars/bar-green-fill.png"));
  BAR_TEXTURES.greenFrame = await loadTexture(systemAssetPath("ui//bars/bar-green-frame.png"));
  BAR_TEXTURES.yellowFrame = await loadTexture(systemAssetPath("ui//bars/bar-yellow-frame.png"));
  BAR_TEXTURES.mixedFrame = await loadTexture(systemAssetPath("ui//bars/bar-mixed-frame.png"));
}

function get(key) {
  return BAR_TEXTURES[key];
}

export const AHTextures = Object.freeze({
  get,
  preload,
});
