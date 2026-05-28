/**
 * @import { ApplicationConfiguration } from "@client/applications/_types.mjs";
 * @import FormDataExtended from "@client/applications/ux/form-data-extended.mjs";
 */

/**
 * @typedef ApplicationConfiguration
 * @property {string} id                        An HTML element identifier used for this Application instance.
 * @property {string} uniqueId                  A string discriminator substituted for {id} in the default
 *                                              HTML element identifier for the class.
 * @property {string[]} classes                 An array of CSS classes to apply to the Application.
 * @property {string} tag                       The HTMLElement tag type used for the outer Application frame.
 * @property {ApplicationWindowConfiguration} window  Configuration of the window behaviors for this Application.
 * @property {Record<string, ApplicationClickAction|{handler: ApplicationClickAction, buttons: number[]}>} actions
 *                                              Click actions supported by the Application and their event handler
 *                                              functions. A handler function can be defined directly which only
 *                                              responds to left-click events. Otherwise, an object can be declared
 *                                              containing both a handler function and an array of buttons which are
 *                                              matched against the PointerEvent#button property.
 * @property {ApplicationFormConfiguration} [form] Configuration used if the application top-level element is a form or
 *                                                 dialog.
 * @property {Partial<ApplicationPosition>} position  Default positioning data for the application.
 */

/**
 * @callback ApplicationClickAction             An on-click action supported by the Application. Run in the context of
 *                                              a {@link foundry.applications.api.HandlebarsApplicationMixin}.
 * @param {PointerEvent} event                  The originating click event.
 * @param {HTMLElement} target                  The capturing HTML element which defines the [data-action].
 * @returns {void|Promise<void>}
 */

/**
 * @typedef ApplicationPosition
 * @property {number} top                       Window offset pixels from top.
 * @property {number} left                      Window offset pixels from left.
 * @property {number|"auto"} width              Un-scaled pixels in width or "auto".
 * @property {number|"auto"} height             Un-scaled pixels in height or "auto".
 * @property {number} scale                     A numeric scaling factor applied to application dimensions.
 * @property {number} zIndex                    A z-index of the application relative to siblings.
 */

/**
 * @typedef ApplicationWindowConfiguration
 * @property {boolean} [frame=true]             Is this Application rendered inside a window frame?
 * @property {boolean} [positioned=true]        Can this Application be positioned via JavaScript or only by CSS.
 * @property {string} [title]                   The window title. Displayed only if the application is framed.
 * @property {string|false} [icon]              An optional Font Awesome icon class displayed left of the window title.
 * @property {ApplicationHeaderControlsEntry[]} [controls]  An array of window control entries.
 * @property {boolean} [minimizable=true]       Can the window app be minimized by double-clicking on the title.
 * @property {boolean} [resizable=false]        Is this window resizable?
 * @property {string} [contentTag="section"]    A specific tag name to use for the .window-content element.
 * @property {string[]} [contentClasses]        Additional CSS classes to apply to the .window-content element.
 */

const { HandlebarsApplicationMixin, Application } = foundry.applications.api;

/**
 * A stock form application meant for async behavior using templates.
 * @abstract
 */
export default class AHApplication extends HandlebarsApplicationMixin(Application) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ah-application"],
    form: {
      handler: AHApplication.#submitHandler,
      closeOnSubmit: true,
    },
    position: {
      width: 450,
      height: "auto",
    },
    timeout: null,
    tag: "form",
    window: {
      contentClasses: ["standard-form"],
    },
  };

  /* -------------------------------------------------- */

  /**
   * Stored form data.
   * @type {object|null}
   */
  #config = null;

  /* -------------------------------------------------- */

  /**
   * Stored form data.
   * @type {object|null}
   */
  get config() {
    return this.#config;
  }

  /* -------------------------------------------------- */

  /**
   * Factory method for asynchronous behavior.
   * @param {ApplicationConfiguration} options            Application rendering options.
   * @returns {Promise<object|null>}    A promise that resolves to the form data, or `null`
   *                                    if the application was closed without submitting.
   */
  static async create(options) {
    const { promise, resolve } = Promise.withResolvers();
    const application = new this(options);
    application.addEventListener("close", () => resolve(application.config), { once: true });
    application.render({ force: true });
    return promise;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _onFirstRender(context, options) {
    const timeout = this.options.timeout;

    if (timeout) setTimeout(() => {
      ui.notifications.error("AH.SOCKET.WARNING.Timeout", {
        format: {
          label: this.constructor.name,
          seconds: timeout / 1000,
        },
      });
      this.close();
    }, timeout);

    await super._onFirstRender(context, options);
  }

  /* -------------------------------------------------- */

  /**
   * Handle form submission. The basic usage of this function is to set `#config`
   * when the form is valid and submitted, thus returning `config: null` when
   * cancelled, or non-`null` when successfully submitted. The `#config` property
   * should not be used to store data across re-renders of this application.
   * @this {DSApplication}
   * @param {SubmitEvent} event           The submit event.
   * @param {HTMLFormElement} form        The form element.
   * @param {FormDataExtended} formData   The form data.
   * @param {object} [submitOptions]      Additional info potentially forwarded by {@link Application#submit}.
   */
  static #submitHandler(event, form, formData, submitOptions = {}) {
    this.#config = this._processFormData(event, form, formData, submitOptions);
  }

  /* -------------------------------------------------- */

  /**
   * Perform processing of the submitted data. To prevent submission, throw an error.
   * @param {SubmitEvent} event           The submit event.
   * @param {HTMLFormElement} form        The form element.
   * @param {FormDataExtended} formData   The form data.
   * @param {object} submitOptions        Additional info potentially forwarded by {@link Application#submit}.
   * @returns {object}                    The data to return from this application.
   */
  _processFormData(event, form, formData, submitOptions) {
    return foundry.utils.expandObject(formData.object);
  }
}
