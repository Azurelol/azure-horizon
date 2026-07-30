import AH from "../config.mjs";
import { StringUtils } from "./_module.mjs";
import Expressions from "../pipelines/expressions.mjs";
import { SourceInfo } from "../data/common/_module.mjs";

/**
 * @typedef TextEditorRenderContext
 * @property {Document} document
 * @property {HTMLElement} target
 * @property {SourceInfo} sourceInfo
 * @property {DOMStringMap} dataset
 * @property {Boolean} valid
 */

export default class TextEditorUtils {

  /**
   * @type {string} The pattern used for optional labeling
   */
  static labelPattern = "(\\{(?<label>.*?)\\})?";

  /**
   * @type {string} The pattern used for optional traits
   */
  static traitsPattern = "(\\|(?<traits>[a-zA-Z-,]+)\\|)?";

  // TODO: Use a JSON map to then convert to a pattern?

  /**
   * @param {String} name The name of the command
   * @param {String} required
   * @param {String[]|null} optional
   * @returns {RegExp} A regex to be used within an enricher
   * @remarks Expects regex sub-patterns to be already escaped
   * @remarks Automatically adds support for the following groups: `label` (String), `traits` (String[]).
   */
  static pattern(name, required, optional = undefined) {
    const joinedOptional = optional ? optional.join("") : "";
    const pattern = `@${name}\\[${required}${joinedOptional}${TextEditorUtils.traitsPattern}\\]${TextEditorUtils.labelPattern}`;
    return new RegExp(pattern, "g");
  }

  /**
   * @returns {HTMLAnchorElement}
   */
  static anchor() {
    const anchor = document.createElement("a");
    anchor.classList.add("ah-inline");
    return anchor;
  }

  /**
   * @param {HTMLAnchorElement} anchor
   * @param {String} name
   *
   */
  static icon(anchor, name) {
    const className = AH.icons[name];
    if (className) {
      const icon = document.createElement("i");
      icon.classList.add("ah-icon", "--xs", ...className.split(" "));
      anchor.append(icon);
      return icon;
    }
  }

  /**
   * @param {HTMLAnchorElement} anchor
   * @param {String} amount
   */
  static amount(anchor, amount) {
    anchor.dataset.amount = amount;
    const dynamicAmount = Expressions.requiresContext(amount);
    if (dynamicAmount) {
      anchor.append(StringUtils.localize("AH.COMMON.Variable"));
    } else {
      anchor.append(amount);
    }
  }

  static getChatMessageFromId(messageId) {
    return game.messages.get(messageId);
  }

  /**
   * @description Resolves the parent document from where an enriched html element came from
   * @param {HTMLEnrichedContentElement} element
   * @returns {Document|ChatMessage}
   */
  static resolveDocument(element) {
    const chatMessage = element.closest("li.chat-message");
    if (chatMessage) {
      const messageId = chatMessage.dataset.messageId;
      return TextEditorUtils.getChatMessageFromId(messageId);
    } else {
      let sheet;
      const framev2 = element.closest(".application");
      if (framev2) {
        sheet = foundry.applications.instances.get(framev2.id);
      } else {
        const framev1 = element.closest(".app");
        if (framev1) {
          sheet = ui.windows[framev1.dataset.appid];
        }
      }
      if (sheet) {
        return sheet.document ?? sheet.element;
      }
    }
    console.debug(`Failed to resolve the document from ${element.toString()}`);
  }

  /**
   * @param {HTMLEnrichedContentElement} element
   * @returns TextEditorRenderContext
   */
  static getRenderContext(element) {
    const document = TextEditorUtils.resolveDocument(element);
    const target = element.firstElementChild;

    let sourceInfo;
    if (document instanceof ChatMessage) {
      sourceInfo = SourceInfo.fromChatMessage(document);
    }
    if (!sourceInfo) {
      sourceInfo = SourceInfo.resolve(document, target);
    }

    const dataset = target?.dataset ?? {};
    return {
      document,
      target,
      sourceInfo,
      dataset,
      valid: target !== undefined,
    };
  }
}
