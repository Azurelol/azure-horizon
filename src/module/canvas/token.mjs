import { AHTextures } from "./_module.mjs";

const HP_BAR_HEIGHT = 16; // pixels
const PRESSURE_BAR_HEIGHT = 12; // pixels
const MARGIN = 4;

const MAX_BAR_SCALE = 2; // don't scale bar textures beyond 4x their native size
const FILL_PADDING = 1; // px, at native texture resolution — scales with the bar

/**
 * Size and position a bar's background/fill sprites, clamping width so
 * the texture never stretches beyond MAX_BAR_SCALE, and centering the
 * (possibly narrower-than-token) bar horizontally.
 * @returns {number} bw - the resolved bar width, in case the caller needs it
 */
function sizeBar(bg, fill, bh, tokenWidth, pct) {
  const nativeWidth = bg.texture.width;
  const bw = Math.min(tokenWidth, nativeWidth * MAX_BAR_SCALE);
  const scale = bw / nativeWidth;
  const pad = FILL_PADDING * scale;

  bg.width = bw;
  bg.height = bh;

  fill.position.set(pad, pad);
  fill.width = Math.max((bw - pad * 2) * pct, 0);
  fill.height = bh - pad * 2;

  return bw;
}

/**
 * A Placeable Object subclass adding system-specific behavior and registered in CONFIG.Token.objectClass.
 */
export class AHToken extends foundry.canvas.placeables.Token {
  /** @override */
  _drawBar(number, bar, data) {
    const { value, max } = data;
    switch (data.attribute) {
      case "resources.hp":
        this.createHitPointBar(value, max, bar);
        return;
      case "resources.pp":
        this.createPressureBar(value, max, bar);
        return;
    }
    return super._drawBar(number, bar, data);
  }

  createHitPointBar(value, max, bar) {
    bar.removeChildren();
    const bh = HP_BAR_HEIGHT;
    const bg = new PIXI.Sprite(AHTextures.get("hpFrame"));
    const fill = new PIXI.Sprite(AHTextures.get("hpFill"));
    const pct = Math.clamp(value, 0, max) / max;

    const bw = sizeBar(bg, fill, bh, this.w, pct);
    bar.addChild(bg, fill);

    // Get the mesh's bounds in world space, then convert into the token's
    // own local coordinate frame — this correctly accounts for the mesh's
    // anchor, position, and scale, unlike getLocalBounds() alone.
    const worldBounds = this.mesh.getBounds();
    const topLeftLocal = this.toLocal(new PIXI.Point(worldBounds.x, worldBounds.y));

    bar.position.set((this.w - bw) / 2, topLeftLocal.y - bh - MARGIN);
  }

  createPressureBar(value, max, bar) {
    bar.removeChildren();
    const bh = PRESSURE_BAR_HEIGHT;
    const bg = new PIXI.Sprite(AHTextures.get("pressureFrame"));
    const fill = new PIXI.Sprite(AHTextures.get("pressureFill"));
    const pct = Math.clamp(value, 0, max) / max;

    const bw = sizeBar(bg, fill, bh, this.w, pct);
    bar.addChild(bg, fill);

    const worldBounds = this.mesh.getBounds();
    const bottomLeftLocal = this.toLocal(new PIXI.Point(worldBounds.x, worldBounds.y + worldBounds.height));

    bar.position.set((this.w - bw) / 2, bottomLeftLocal.y + MARGIN);
  }
}
