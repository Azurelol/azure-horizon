import { AHActorSheet } from "./actor-sheet.mjs";
import { renderTemplate, systemTemplatePath } from "../../constants.mjs";

export class AHPartySheet extends AHActorSheet {

  /**
   * @inheritDoc
   * @type ApplicationConfiguration
   * @override
   */
  static DEFAULT_OPTIONS = {
    actions: {},
    position: { width: 920, height: 1000 },
    window: {
      contentClasses: ["ah-party-sheet"],
      resizable: true,
      icon: "fas fa-people-group",
    },
  };

  /**
   * @override
   * @type Record<ApplicationTab>
   * */
  static TABS = {
    primary: {
      tabs: [
        { id: "overview", label: "AH.SHEET.Tabs.Overview", icon: "ra ra-double-team" },
      ],
      initial: "overview",
    },
  };

  /**
   * @override
   * @type Record<HandlebarsTemplatePart>
   */
  static PARTS = {
    widgets: {
      template: systemTemplatePath("sheets/actor/party/party-section-widgets"),
    },
    // Custom
    tabs: {
      template: systemTemplatePath("sheets/actor/party/party-section-nav"),
    },
    // Tabs
    overview: {
      template: systemTemplatePath("sheets/actor/party/party-section-overview"),
    },
  };

  /**
   * @returns {PartyData}
   */
  get system() {
    return this.actor.system;
  }

  /**
   * Prepare application tab data for a single tab group.
   * @param {string} group The ID of the tab group to prepare.
   * @returns {Record<string, ApplicationTab>}
   * @protected
   */
  _prepareTabs(group) {
    /** @type {Record<string, ApplicationTab>} **/
    const tabs = super._prepareTabs(group);
    if (!game.user.isGM) delete tabs.settings;
    return tabs;
  }

  /**
   * Allow subclasses to dynamically configure render parts.
   * @param {HandlebarsRenderOptions} options
   * @returns {Record<string, HandlebarsTemplatePart>}
   * @protected
   */
  _configureRenderParts(options) {
    /** @type {Record<string, HandlebarsTemplatePart>} **/
    const parts = super._configureRenderParts(options);
    if (!game.user.isGM) delete parts.settings;
    return parts;
  }

  /** @override */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.isGM = game.user.isGM;
    const data = this.system;
    context.characters = await data.getCharacters();
    return context;
  }

  /** @inheritdoc */
  async _preparePartContext(partId, ctx, options) {
    const context = await super._preparePartContext(partId, ctx, options);
    // IMPORTANT: Set the active tab
    if (partId in context.tabs) context.tab = context.tabs[partId];
    switch (partId) {
      case "tabs":
        context.tabs = this._prepareTabs("primary");
        break;
      case "overview":
        context.overview = await renderTemplate(`sheets/actor/party/party-section-overview-${this.theme}`, context);
        break;
      case "character":
        break;
    }
    return context;
  }

  // TODO: Provide setting
  get theme () {
    return "modern";
  }

  /** @inheritDoc */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);

    // Set current theme classes
    const windowContent = this.element.querySelector(".window-content");
    if (!windowContent) return;
    windowContent.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) windowContent.classList.remove(cls);
    });
    const theme = this.theme;
    windowContent.classList.add(`theme-${theme}`);
  }

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
  }
}
