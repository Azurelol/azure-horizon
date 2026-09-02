import { systemAssetPath } from "../constants.mjs";

/**
 * A Placeable Object subclass adding system-specific behavior and registered in CONFIG.Token.objectClass.
 */
export class AHToken extends foundry.canvas.placeables.Token {
  /** @override */
  _drawBar(number, bar, data) {
    if (data.attribute !== "resources.hp") return super._drawBar(number, bar, data);
    const { value, max } = data;
    if (number === 0) {
      // Example: use a texture instead of Graphics.beginFill()
      bar.removeChildren();

      const bg = PIXI.Sprite.from(systemAssetPath("bars/bar-bg.png"));
      const fill = PIXI.Sprite.from(systemAssetPath("bars/bar-fill.png"));

      // Foundry passes bar as a Graphics container positioned/sized for you;
      // read its computed width/height off `data` or the token's dimensions
      const pct = Math.clamp(value, 0, max) / max;
      fill.width = bar.width * pct;
      fill.height = bar.height;
      bg.width = bar.width;
      bg.height = bar.height;

      bar.addChild(bg, fill);
      return;
    }
    return super._drawBar(number, bar, data);
  }
}
