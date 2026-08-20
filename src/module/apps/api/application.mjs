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
const { DragDrop } = foundry.applications.ux;

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
  #dragDrop;

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
    this.#dragDrop = new DragDrop.implementation({
      dragSelector: ".draggable",
      dropSelector: ".window-content",
      permissions: {
        dragstart: this._canDragStart.bind(this),
        drop: this._canDragDrop.bind(this),
      },
      callbacks: {
        dragstart: this._onDragStart.bind(this),
        dragover: this._onDragOver.bind(this),
        drop: this._onDrop.bind(this),
      },
    });
  }

  /**
   * Define whether a user is able to begin a dragstart workflow for a given drag selector.
   * @param {string} selector       The candidate HTML selector for dragging
   * @returns {boolean}             Can the current user drag this selector?
   * @protected
   */
  _canDragStart(selector) {
    return true;
  }

  /**
   * Define whether a user is able to conclude a drag-and-drop workflow for a given drop selector.
   * @param {string} selector       The candidate HTML selector for the drop target
   * @returns {boolean}             Can the current user drop on this selector?
   * @protected
   */
  _canDragDrop(selector) {
    return this.isEditable;
  }

  /**
   * An event that occurs when a drag workflow begins for a draggable Item or ActiveEffect on the sheet.
   * @param {DragEvent} event       The initiating drag start event
   * @returns {Promise<void>}
   * @protected
   */
  _onDragStart(event) {
    const target = event.currentTarget;
    if ("link" in event.target.dataset) return;
    let dragData;

    // Owned Items
    if (target.dataset.uuid) {
      const item = fromUuidSync(target.dataset.uuid);
      // Real, loaded Document (e.g. owned item) — use its own drag data.
      if (item instanceof foundry.abstract.Document) {
        dragData = item.toDragData();
      }
      // Compendium index entry (or nothing cached yet) — ship type+uuid, let the
      // drop target resolve it via fromUuid.
      else {
        dragData = { type: "Item", uuid: target.dataset.uuid };
      }
    }

    // Set data transfer
    if (!dragData) return;
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
  }

  /**
   * An event that occurs when a drag workflow moves over a drop target.
   * @param {DragEvent} event
   * @protected
   */
  _onDragOver(event) {
    event.preventDefault(); // required to allow dropping
  }

  // Handle the actual drop
  async _onDrop(event) {
    // eslint-disable-next-line no-undef
    const data = TextEditor.implementation.getDragEventData(event);

    // Dropped Documents
    const documentClass = foundry.utils.getDocumentClass(data.type);
    if (documentClass) {
      const document = await documentClass.fromDropData(data);
      await this._onDropDocument(event, document);
    }
  }

  /**
   * @template {Document} TDocument
   * @param {DragEvent} event         The initiating drop event
   * @param {TDocument} document       The resolved Document class
   * @returns {Promise<TDocument|null>} A Document of the same type as the dropped one in case of a successful result,
   *                                    or null in case of failure or no action being taken
   * @protected
   */
  async _onDropDocument(event, document) {
    return null;
  }

  /* -------------------------------------------------- */
  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#dragDrop.bind(this.element);
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
