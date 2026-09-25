import { receiveSocketEvent, sendSocketEvent } from "../constants.mjs";
import AH from "../config.mjs";
import { StringUtils } from "../utils/_module.mjs";

/**
 * Define the valid anchor locations for a Tooltip displayed on a Placeable Object
 * @see {@link foundry.helpers.interaction.TooltipManager}
 */
const TEXT_ANCHOR_POINTS = Object.freeze({
  /**
   * Anchor the tooltip to the center of the element.
   */
  CENTER: 0,

  /**
   * Anchor the tooltip to the bottom of the element.
   */
  BOTTOM: 1,

  /**
   * Anchor the tooltip to the top of the element.
   */
  TOP: 2,

  /**
   * Anchor the tooltip to the left of the element.
   */
  LEFT: 3,

  /**
   * Anchor the tooltip to the right of the element.
   */
  RIGHT: 4,
});

/**
 * @typedef Point
 * A 2D point, expressed as {x, y}.
 * @property {number} x    The x-coordinate
 * @property {number} y    The y-coordinate
 */

/**
 * @typedef {'CENTER'|'TOP'|'BOTTOM'|'LEFT'|'RIGHT'} TextAnchorPoint
 */

/**
 * @typedef {object} AH_ScrollingTextData
 * @property {Point} origin
 * @property {string} content
 * @property {object} [options]
 * @property {number} [options.duration=2000]  The duration of the scrolling effect in milliseconds
 * @property {number} [options.distance]       The distance in pixels that the scrolling text should travel
 * @property {TextAnchorPoint} [options.anchor]    The original anchor point where the text appears
 * @property {TextAnchorPoint} [options.direction] The direction in which the text scrolls
 * @property {number} [options.jitter=0]       An amount of randomization between [0, 1] applied to the initial position
 * @property {object} [options.textStyle={}]   Additional parameters of PIXI.TextStyle which are applied to the text
 */

/**
 * @param {AH_ScrollingTextData} data
 */
function onScrollingText(data) {
  canvas.interface.createScrollingText(data.origin, data.content, data.options);
}

/**
 * @desc Provides utility functions to use Foundry's PIXI-based canvas
 */
export class Canvas {

  /**
   * @returns {Point}
   */
  static get center() {
    return {
      x: canvas.dimensions.sceneRect.x + canvas.dimensions.sceneRect.width / 2,
      y: canvas.dimensions.sceneRect.y + canvas.dimensions.sceneRect.height / 2,
    };
  }

  /**
   * @returns {Record<TextAnchorPoint,Number>}
   */
  static get textAnchorPoints() {
    return TEXT_ANCHOR_POINTS;
  }

  /**
   * @param {AH_ScrollingTextData} data
   */
  static broadcastScrollingText(data) {
    onScrollingText(data);
    sendSocketEvent(AH.sockets.SCROLLING_TEXT, data);
  }

  static initialize() {
    receiveSocketEvent(AH.sockets.SCROLLING_TEXT, onScrollingText);
  }
}
