import { AHTextures } from "./_module.mjs";

const HP_BAR_HEIGHT = 12; // pixels
const PRESSURE_BAR_HEIGHT = 12; // pixels
const MARGIN = 4;

const MAX_BAR_SCALE = 2; // don't scale bar textures beyond 4x their native size
const FILL_PADDING = 1; // px, at native texture resolution — scales with the bar

/**
 * @typedef Size
 * @property width
 * @property height
 */

/**
 * Size and position a bar's background/fill sprites, clamping width so
 * the texture never stretches beyond MAX_BAR_SCALE, and centering the
 * (possibly narrower-than-token) bar horizontally.
 * @returns {Size} bw - the resolved bar width, in case the caller needs it
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

  return { width: bg.width, height: bg.height };
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

  /**
   * @param bar
   * @param {Size} size
   * @param {'top'|'bottom'} position
   * @param {Number} offset
   */
  translateBar(bar, size, position, offset = 0) {
    const worldBounds = this.mesh.getBounds();
    switch (position) {
      case "top":{
        const topLeftLocal = this.toLocal(new PIXI.Point(worldBounds.x, worldBounds.y));
        bar.position.set((this.w - size.width) / 2, topLeftLocal.y - size.height - MARGIN - offset);
        break;
      }

      case "bottom":{
        const bottomLeftLocal = this.toLocal(new PIXI.Point(worldBounds.x, worldBounds.y + worldBounds.height));
        bar.position.set((this.w - size.width) / 2, bottomLeftLocal.y + MARGIN + offset);
        break;
      }
    }
  }

  // TODO: Use a green bar for heroes
  createHitPointBar(value, max, bar) {
    bar.removeChildren();

    const hero = this.actor.type === "hero";

    const bh = HP_BAR_HEIGHT;
    const bg = new PIXI.Sprite(AHTextures.get(hero ? "hpPartyFrame" : "hpFrame"));
    const fill = new PIXI.Sprite(AHTextures.get(hero ? "hpPartyFill" : "hpFill"));
    const pct = Math.clamp(value, 0, max) / max;

    const size = sizeBar(bg, fill, bh, this.w, pct);
    bar.addChild(bg, fill);

    this.translateBar(bar, size, "bottom");
  }

  createPressureBar(value, max, bar) {
    bar.removeChildren();
    const bh = PRESSURE_BAR_HEIGHT;
    const bg = new PIXI.Sprite(AHTextures.get("pressureFrame"));
    const fill = new PIXI.Sprite(AHTextures.get("pressureFill"));
    const pct = Math.clamp(value, 0, max) / max;

    const size = sizeBar(bg, fill, bh, this.w, pct);
    bar.addChild(bg, fill);

    this.translateBar(bar, size, "bottom", HP_BAR_HEIGHT + MARGIN);
  }
}
