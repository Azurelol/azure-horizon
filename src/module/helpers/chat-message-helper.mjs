import { systemID } from "../constants.mjs";
import Flags from "../data/common/flags.mjs";

/**
 * @param {String} messageId
 * @returns {undefined|ChatMessage}
 */
function fromId(messageId) {
  return game.messages.get(messageId);
}

/**
 * @description Registers a context menu item for the chat messages with the specified flag
 * @param {String} flag The flag to check against, from those within {@link Flags}
 * @param {String} name The localized name for the item name
 * @param {String} iconClass The css class of the icon to use
 * @param {Promise<ChatMessage, void>} callback The function to execute for the item
 */
function registerContextMenuItem(flag, name, iconClass, callback) {
  const hook = (application, menuItems) => {
    menuItems.unshift({
      name: name,
      icon: `<i class="${iconClass}"></i>`,
      group: systemID,
      condition: (li) => {
        const messageId = li.dataset.messageId;
        /** @type ChatMessage | undefined */
        const message = fromId(messageId);
        return message.getFlag(systemID, flag);
      },
      callback: async (li) => {
        const messageId = li.dataset.messageId;
        /** @type ChatMessage | undefined */
        const message = fromId(messageId);
        if (message) {
          const damage = message.getFlag(systemID, flag);
          if (damage) {
            callback(message);
          }
        }
      },
    });
  };

  Hooks.on("getChatMessageContextOptions", hook);
}

/**
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 * @param {String} actionName - The name of the data-action, e.g: "roll"
 * @param {(data: Object) => Promise<void>} onClick
 */
function handleClick(message, html, actionName, onClick) {
  html.querySelectorAll(`a[data-action="${actionName}"]`).forEach((element) => {
    element.addEventListener("click", async (event) => {
      event.preventDefault();
      await onClick({ ...element.dataset });
    });
  });
}

/**
 * @param {ChatMessage} message
 * @param {HTMLElement} html
 * @param {String} actionName
 * @param {(data: Object) => Promise<void>} action
 */
async function handleClickRevert(message, html, actionName, action) {
  html.querySelectorAll(`a[data-action="${actionName}"]`).forEach((element) => {
    const messageContent = html.querySelector(".message-content");
    const reverted = message.getFlag(systemID, Flags.ChatMessage.RevertedAction)?.includes(actionName);

    if (reverted) {
      messageContent?.classList.add("strikethrough");
      element.classList.add("action-disabled");
    } else {
      element.addEventListener("click", async (event) => {
        event.preventDefault();
        try {
          await action({ ...element.dataset });
          const revertedActions = message.getFlag(systemID, Flags.ChatMessage.RevertedAction) ?? [];
          revertedActions.push(actionName);
          await message.setFlag(systemID, Flags.ChatMessage.RevertedAction, revertedActions);
        } catch (ex) {
          console.debug(ex);
        }
      });
    }
  });
}

const ChatMessageHelper = Object.freeze({
  registerContextMenuItem,
  fromId,
  handleClick,
  handleClickRevert,
});

export default ChatMessageHelper;
