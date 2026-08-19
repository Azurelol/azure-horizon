import AH from "../config.mjs";
import { systemID } from "../constants.mjs";

export default class Keybindings {

  /**
   * @typedef KeybindingActionBinding
   * A Client Keybinding Action Binding
   * @property {number} [index]           A numeric index which tracks this bindings position during form rendering
   * @property {string} key               The KeyboardEvent#code value from
   * @property {string} logicalKey        The Keyboard logical code if universal mode is enable (it is code otherwise)
   *   {@link https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/code/code_values}
   * @property {string[]} [modifiers]     An array of modifiers keys from
   *                                      {@link foundry.helpers.interaction.KeyboardManager.MODIFIER_KEYS}
   *                                      which are required for this binding to be activated
   */

  /**
   * @typedef KeybindingActionConfig
   * A Client Keybinding Action Configuration
   * @property {string} [namespace]                       The namespace within which the action was registered
   * @property {string} name                              The human-readable name.
   * @property {string} [hint]                            An additional human-readable hint.
   * @property {KeybindingActionBinding[]} [uneditable]   The default bindings that can never be changed nor removed.
   * @property {KeybindingActionBinding[]} [editable]     The default bindings that can be changed by the user.
   * @property {(context: KeyboardEventContext) => boolean|void} [onDown]
   *                                                      A function to execute when a key down event occurs.
   *                                                      If True is returned, the event is consumed and no further
   *                                                      keybinds execute.
   * @property {(context: KeyboardEventContext) => boolean|void} [onUp]
   *                                                      A function to execute when a key up event occurs. If True is
   *                                                      returned, the event is consumed and no further keybinds execute.
   * @property {boolean} [repeat=false]                   If True, allows Repeat events to execute the Action's onDown.
   *                                                      Defaults to false.
   * @property {boolean} [restricted=false]               If true, only a GM can edit and execute this Action.
   * @property {string[]} [reservedModifiers]             Modifiers such as `["CONTROL"]` that can be also pressed when
   *                                                      executing this Action. Prevents using one of these modifiers as
   *                                                      a Binding.
   * @property {number} [precedence=0]                    The preferred precedence of running this Keybinding Action.
   * @property {number} [order]                           The recorded registration order of the action.
   */

  /**
   * @callback RegisterKeybindings
   * @param {Record<string, KeybindingActionConfig>} entries
   */

  /**
   * All hotkeys provided by the system.
   * @return {Record<string, KeybindingActionConfig>}
   */
  static get bindings() {
    /** @type {Record<string, KeybindingActionConfig>} */
    const keybindings = {};
    Hooks.callAll(AH.hooks.REGISTER_KEYBINDINGS, keybindings);
    return keybindings;
  }

  static initialize() {
    for (const [key, binding] of Object.entries(this.bindings)) {
      game.keybindings.register(systemID, key, binding);
    }
  }
}
