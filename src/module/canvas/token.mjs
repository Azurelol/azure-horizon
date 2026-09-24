import { AHTextures } from "./_module.mjs";
import { systemAssetPath, systemID, systemNS } from "../constants.mjs";

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
 * @typedef TargetMarkerData
 * @property {String} key
 * @property {'center'|'above'|'below'} position
 * @property {Size} size
 */

/**
 * @type {Record<String, TargetMarkerData>}
 */
const TARGET_MARKERS = Object.freeze({
  mark: {
    key: "markImage",
    position: "above",
    size: {
      width: 64,
      height: 64,
    },
  },
});

/**
 * A Placeable Object subclass adding system-specific behavior and registered in CONFIG.Token.objectClass.
 */
export class AHToken extends foundry.canvas.placeables.Token {

  #effectMarkers;

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

  /** @override */
  _refreshEffects() {
    super._refreshEffects();
    for (const effect of this.actor?.effects ?? []) {
      if (effect.statuses.has("mark")) {
        this._drawEffectMarker(effect, TARGET_MARKERS.mark);
      }
    }
  }

  async _draw(options) {
    await super._draw(options);
    this.#effectMarkers = {};
  }

  /**
   * @param effect
   * @param {TargetMarkerData} data
   * @private
   */
  _drawEffectMarker(effect, data) {
    if (this.#effectMarkers?.[effect.id]) return; // already drawn
    const texture = AHTextures.get(data.key);
    const sprite = new PIXI.Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = data.size.width;
    sprite.height = data.size.height;
    switch (data.position) {
      case "center":
        sprite.position.set(this.w / 2, this.h / 2);
        break;

      case "above":
        this.translateImage(sprite, data.size, "top", 0);
        break;

      case "below":
        this.translateImage(sprite, data.size, "bottom", 0);
        break;
    }

    this.addChildAt(sprite, 0);
    (this.#effectMarkers ??= {})[effect.id] = sprite;
  }

  /**
   * @param obj A pixi object. If it has an `anchor` (e.g. a Sprite), the anchor
   *   is accounted for so it lines up correctly whether it's anchored at a
   *   corner or its center. Containers (no `.anchor`) are treated as anchor (0,0),
   *   i.e. positioned by their top-left corner.
   * @param {Size} size
   * @param {'top'|'bottom'|'topLeft'|'bottomLeft'} position
   * @param {Number} offset
   */
  translateImage(obj, size, position, offset = 0) {
    const worldBounds = this.mesh.getBounds();
    const isTop = position === "top" || position === "topLeft";
    const isLeftVariant = position.endsWith("Left");

    const anchorWorldX = isLeftVariant
      ? worldBounds.x
      : worldBounds.x + worldBounds.width / 2;
    const anchorWorldY = isTop ? worldBounds.y : worldBounds.y + worldBounds.height;
    const anchorLocal = this.toLocal(new PIXI.Point(anchorWorldX, anchorWorldY));

    const anchorX = obj.anchor?.x ?? 0;
    const anchorY = obj.anchor?.y ?? 0;

    const leftEdgeX = (this.w - size.width) / 2;
    const topEdgeY = isTop
      ? anchorLocal.y - size.height - MARGIN - offset
      : anchorLocal.y + MARGIN + offset;

    obj.position.set(
      leftEdgeX + anchorX * size.width,
      topEdgeY + anchorY * size.height,
    );
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

    this.translateImage(bar, size, "bottomLeft");
  }

  createPressureBar(value, max, bar) {
    bar.removeChildren();
    const bh = PRESSURE_BAR_HEIGHT;
    const bg = new PIXI.Sprite(AHTextures.get("pressureFrame"));
    const fill = new PIXI.Sprite(AHTextures.get("pressureFill"));
    const pct = Math.clamp(value, 0, max) / max;

    const size = sizeBar(bg, fill, bh, this.w, pct);
    bar.addChild(bg, fill);

    this.translateImage(bar, size, "bottomLeft", HP_BAR_HEIGHT + MARGIN);
  }
}
