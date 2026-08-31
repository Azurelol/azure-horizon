import Tracks from "../../pipelines/tracks.mjs";
import { ObjectUtils, StringUtils } from "../../utils/_module.mjs";
import { Dialogs } from "../../helpers/_module.mjs";

/**
 * @category Mixins
 * @param {typeof Container} ContainerClass  The parent container class being mixed.
 */
export function DocumentSheetMixin(ContainerClass) {
  return class DocumentSheet extends ContainerClass {
    /** @inheritdoc */
    static DEFAULT_OPTIONS = {
      actions: {

        updateTrack: this.#updateTrack,
        displayTrack: this.#displayTrack,
        addArrayElement: this.#addArrayElement,
        removeArrayElement: this.#removeArrayElement,
      },
    };

    /**
     * @this AHItemSheet
     * @param {PointerEvent} event   The originating click event
     * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
     * @returns {Promise<void>}
     */
    static async #addArrayElement(event, target) {
      const path = target.dataset.path;
      if (path) {
        const array = ObjectUtils.getProperty(this.item, path);
        if (array) {
          array.push(null);
          await this.item.update({
            [`${path}`]: array,
          });
        }
      }
    }

    /**
     * @this AHActorSheet
     * @param {PointerEvent} event   The originating click event.
     * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
     * @returns {Promise<void>}
     */
    static async #removeArrayElement(event, target) {
      const { path, prompt, label } = target.dataset;
      const index = Number.parseInt(target.dataset.index);
      if (path) {
        if (prompt) {
          const options = {
            title: StringUtils.localize("AH.COMMON.Remove"),
            message: StringUtils.localize("AH.DIALOG.RemoveMessage", { label: label ?? "AH.COMMON.Entry" }),
          };
          const confirm = await Dialogs.confirm (options);
          if (!confirm) {
            return;
          }
        }
        /** @type [] **/
        const array = ObjectUtils.getProperty(this.actor, path);
        if (array && (index !== undefined)) {
          array.splice(index, 1);
          await this.actor.update({
            [`${path}`]: array,
          });
        }
      }
    }

    /**
     * @param {PointerEvent} event   The originating click event
     * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
     * @returns {Promise<void>}
     */
    static async #updateTrack(event, target) {
      const { updateAmount, id, path, alternate } = target.dataset;
      let increment = parseInt(updateAmount);
      if (alternate && (event.button === 2)) {
        increment = -increment;
      }

      const lookup = this.actor.resolveTracker(id);
      if (lookup) {
        return Tracks.updateForDocument(lookup.document, path, increment);
      }
    }

    /**
     * @param {PointerEvent} event   The originating click event
     * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
     * @returns {Promise<void>}
     */
    static async #displayTrack(event, target) {
      const { id, path } = target.dataset;
      const lookup = this.document.resolveTracker(id);
      if (lookup) {
        const tracker = foundry.utils.getProperty(lookup.document, path);
        return Tracks.sendToChat(lookup.document, tracker);
      }
    }
  };
}
