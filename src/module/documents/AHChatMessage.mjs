/**
 * A simple extension that adds a hook at the end of data prep.
 */
export class AHChatMessage extends foundry.documents.ChatMessage {
  /** @inheritdoc */
  prepareDerivedData() {
    super.prepareDerivedData();

    /**
     * Flexible hook for modules to alter derived document data.
     * @param {AHChatMessage} message      The chat message preparing derived data.
     */
    Hooks.callAll("AH.prepareChatMessageData", this);
  }
}
