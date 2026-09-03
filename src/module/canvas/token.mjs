import { AHTextures } from "./_module.mjs";

const HP_BAR_HEIGHT = 16; // pixels
const PRESSURE_BAR_HEIGHT = 12; // pixels
const MARGIN = 4;

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
    const bw = this.w; // token width in pixels
    const bh = HP_BAR_HEIGHT;
    const bg = new PIXI.Sprite(AHTextures.get("frame"));
    const fill = new PIXI.Sprite(AHTextures.get("fill"));
    const pct = Math.clamp(value, 0, max) / max;
    bg.width = bw;
    bg.height = bh;
    fill.width = bw * pct;
    fill.height = bh;
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
    const bw = this.w;
    const bh = PRESSURE_BAR_HEIGHT;
    const bg = new PIXI.Sprite(AHTextures.get("yellowFrame"));
    const fill = new PIXI.Sprite(AHTextures.get("yellowFill"));
    const pct = Math.clamp(value, 0, max) / max;
    bg.width = bw;
    bg.height = bh;
    fill.width = bw * pct;
    fill.height = bh;
    bar.addChild(bg, fill);

    const worldBounds = this.mesh.getBounds();
    const bottomLeftLocal = this.toLocal(new PIXI.Point(worldBounds.x, worldBounds.y + worldBounds.height));

    bar.position.set((this.w - bw) / 2, bottomLeftLocal.y + (MARGIN * 2));
  }
}
