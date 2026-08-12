import { systemPath } from "../../constants.mjs";
import { AHTokenDocument } from "../../documents/_module.mjs";

/**
 * A custom Token HUD that implements Draw Steel effect handling.
 */
export default class AHTokenHUD extends foundry.applications.hud.TokenHUD {

  // /**
  //  * Toggle the combat state of all controlled Tokens.
  //  * @this {TokenHUD}
  //  * @param {PointerEvent} event
  //  * @param {HTMLButtonElement} target
  //  * @returns {Promise<void>}
  //  * @override
  //  */
  // static async #onToggleCombat(event, target) {
  //   const tokens = canvas.tokens.controlled.map(t => t.document);
  //   if (!this.object.controlled) tokens.push(this.document);
  //   try {
  //     if (this.document.inCombat) await AHTokenDocument.implementation.deleteCombatants(tokens);
  //     else await AHTokenDocument.implementation.createCombatants(tokens);
  //   } catch(err) {
  //     ui.notifications.warn(err.message);
  //   }
  // }

}
