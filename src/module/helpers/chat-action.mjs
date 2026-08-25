import { StringUtils } from "../utils/_module.mjs";
import { renderTemplate } from "../constants.mjs";
import Targeting from "./targeting.mjs";
import AH from "../config.mjs";

/**
 * @description Actions that can be executed from chat messages.
 * @property {String} name The name of the action to be used
 * @property {String} icon The font awesome icon
 * @property {String} img An image to use
 * @property {String} label An optional label to use.
 * @property {String} tooltip The localized tooltip to use
 * @property {Object} fields The fields to use for the action's dataset
 * @property {Boolean} owner Whether this action can only be applied the owner
 * @property {Flag|undefined} flag
 * @property {DOMStringMap|undefined} dataset
 * @property {String} classes
 * @property {String} style
 * @property {String} color
 * @property {String[]} traits Traits for this action.
 * @property {Boolean} targeted Whether this action can be used on targeted tokens (during the chat message generation)
 * @property {Boolean} selected Whether this action can be used on selected tokens instead.
 * @remarks Expects an action handler where dataset.id is a reference to an actor
 */
export default class ChatAction {
  constructor(name, icon, tooltip, fields) {
    this.name = name;
    this.icon = icon;
    this.tooltip = tooltip;
    this.withFields(fields);
    this.dataset = {};
    // this.label = "AH.CHAT.ApplySelected";
    this.owner = false;
    this.targeted = true;
    this.selected = false;
  }

  /**
	 * @returns {ChatAction}
	 */
  requiresOwner() {
    this.owner = true;
    return this;
  }

  /**
	 * @param {Object} fields
	 */
  withFields(fields) {
    this.fields = StringUtils.toBase64(fields ?? {});
    return this;
  }

  /**
	 * @param {String} flag
	 * @param {Object} value
	 * @returns {ChatAction}
	 */
  setFlag(flag, value = true) {
    this.flag = {
      key: flag,
      value: value,
    };
    return this;
  }

  /**
	 * @param {Record<string, string>} dataset
	 * @return {ChatAction}
	 */
  withDataset(dataset) {
    this.dataset = dataset;
    return this;
  }

  /**
	 * @param {FUActor} actor
	 * @return {ChatAction}
	 */
  forActor(actor) {
    return this.withDataset({
      ["actor-id"]: actor.uuid,
      ["actor-img"]: actor.img,
    }).notTargeted();
  }

  /**
	 * @returns {ChatAction}
	 */
  notTargeted() {
    this.targeted = false;
    return this;
  }

  /**
	 * @returns {ChatAction}
	 */
  withSelected() {
    this.selected = true;
    return this;
  }

  /**
	 * @param {String} label
	 * @returns {ChatAction}
	 */
  withLabel(label) {
    this.label = label ?? "AH.CHAT.ApplySelected";
    return this;
  }

  /**
   * @returns {ChatAction}
   */
  clearLabel() {
    this.label = null;
    return this;
  }

  /**
	 * @param {String} color
	 * @return {ChatAction}
	 */
  withColor(color) {
    this.color = color;
    return this;
  }

  /**
	 * @param {String} style
	 * @returns {ChatAction}
	 */
  withStyle(style) {
    this.style = style;
    return this;
  }

  /**
	 * @param {...String} classes
	 * @returns {ChatAction}
	 */
  withClasses(...classes) {
    this.classes = classes.join(" ");
    return this;
  }

  /**
	 * @param {String} img
	 * @returns {ChatAction}
	 */
  withImage(img) {
    this.img = img;
    return this;
  }

  /**
	 * @param {String[]} traits
	 * @returns {ChatAction}
	 */
  withTraits(traits) {
    this.traits = traits;
    return this;
  }

  /**
	 * @param {ChatAction[]} actions
	 * @param {EventTarget[]} targetData
	 * @param {Boolean} retarget
	 * @return {Promise<String>}
	 */
  static async renderToChat(actions, targetData = [], retarget = true) {
    const html = await renderTemplate("chat/partials/chat-actions", {
      retarget: retarget,
      targets: targetData,
      actions: actions,
      targetedActions: actions.filter((a) => a.targeted),
      selectedActions: actions.filter((a) => a.selected),
    });
    return new Handlebars.SafeString(html);
  }

  /**
   * @param {DOMStringMap} dataset
   * @return {Promise<AHActor[]>}
   */
  static async getTargetsFromAction(dataset) {
    let targets = [];
    let actorId = dataset ? (dataset.actorId ?? dataset.uuid) : undefined;
    if (actorId) {
      const actor = await fromUuid(actorId);
      targets.push(actor);
    } else {
      targets = await Targeting.getSelected();
    }
    return targets;
  }

  /**
   * @type {ChatAction}
   * @description Target the token
   */
  static TARGET_ACTION = new ChatAction("targetSingle", "ah-icon-target", "AH.ACTION.Target").setFlag(AH.flags.ChatMessage.Targeting);
}
