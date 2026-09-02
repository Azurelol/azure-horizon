import { AHActorSheet } from "./actor-sheet.mjs";
import { getSystemSetting, renderTemplate, setSystemSetting, systemTemplatePath } from "../../constants.mjs";
import { CodexBrowser } from "../ui/_module.mjs";
import { ActionTableRenderer, EquipmentTableRenderer } from "../item/_module.mjs";
import { CharacterSheet } from "./character-sheet.mjs";
import { FoundryUtils, StringUtils } from "../../utils/_module.mjs";
import AH from "../../config.mjs";

export class PartySheet extends AHActorSheet {

  /**
   * @inheritDoc
   * @type ApplicationConfiguration
   * @override
   */
  static DEFAULT_OPTIONS = {
    position: { width: 920, height: 1000 },
    window: {
      contentClasses: ["ah-party"],
      resizable: true,
      icon: "fas fa-people-group",
    },
    actions: {
      activate: this.#activate,

      revealActor: this.#revealActor,
      addCodexEntry: this.#addCodexEntry,
      onCodexEntry: this.#onCodexEntry,
      importCodexActorEntry: this.#onImportCodexActorEntry,
      importCodexJournalEntry: this.#onImportCodexJournalEntry,
      resetCodexTags: this.#onResetCodexTags,
    },
  };

  /**
   * @this PartySheet
   * @returns {Promise<void>}
   */
  static async #activate() {
    console.debug(`Setting ${this.actor.name} as the active party.`);
    await setSystemSetting("activeParty", this.actor._id);
    ui.notifications.info(game.i18n.format("AH.PARTY.ActiveSetNotification", { name: this.actor.name }));
  }

  /**
   * @returns {AHActor|undefined}
   */
  static getActiveActor() {
    const activePartyUuid = getSystemSetting("activeParty");
    if (activePartyUuid) {
      const party = fromUuidSync(`Actor.${activePartyUuid}`);
      if (party && (party.type === "party")) {
        return party;
      }
    }
    return undefined;
  }

  /**
   * @returns {Promise<void>}
   */
  static async toggleActive() {
    const party = PartySheet.getActiveActor();
    if (party) {
      const sheet = party.sheet;
      if (sheet.rendered) {
        sheet.close();
      } else {
        sheet.render(true);
      }
    } else {
      ui.notifications.warn("AH.PARTY.ActivePartyNotAssigned", { localize: true });
    }
  }

  /**
   * @override
   * @type Record<ApplicationTab>
   * */
  static TABS = {
    primary: {
      tabs: [
        { id: "overview", label: "AH.SHEET.Tabs.Overview", icon: "ra ra-double-team" },
        { id: "inventory", label: "AH.SHEET.Tabs.Inventory", icon: "ra ra-ammo-bag" },
        { id: "codex", label: "AH.SHEET.Tabs.Codex", icon: "ra ra-book" },
        { id: "settings", label: "AH.SHEET.Tabs.Settings", icon: "ra ra-candle" },
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
      template: systemTemplatePath("sheets/actor/party/party-widgets"),
    },
    tabs: {
      template: systemTemplatePath("sheets/document-tabs"),
    },
    // Tabs
    overview: {
      template: systemTemplatePath("sheets/actor/party/party-overview"),
    },
    inventory: {
      template: systemTemplatePath("sheets/actor/actor-inventory"),
    },
    codex: {
      template: systemTemplatePath("sheets/actor/party/party-codex"),
    },
    settings: {
      template: systemTemplatePath("sheets/actor/party/party-settings"),
    },
  };

  #codexBrowser;
  #codexDrop;

  /**
   * @return {CodexBrowser}
   */
  get codexBrowser() {
    if (!this.#codexBrowser) {
      this.#codexBrowser = new CodexBrowser(this);
    }
    return this.#codexBrowser;
  }

  /**
   * @returns {PartyDataModel}
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
    return context;
  }

  #equipmentTableRenderer = new EquipmentTableRenderer({ title: "AH.ITEM.Equipment", actions: AHActorSheet.getCompendiumTableActions("equipment"), preview: true, stash: true });

  /** @inheritdoc */
  async _preparePartContext(partId, ctx, options) {
    const context = await super._preparePartContext(partId, ctx, options);
    const data = this.system;
    // IMPORTANT: Set the active tab
    if (partId in context.tabs) context.tab = context.tabs[partId];
    switch (partId) {
      case "tabs":
        context.tabs = this._prepareTabs("primary");
        break;
      case "overview":
        context.characters = await this.system.getHeroes();
        context.overview = await renderTemplate(`sheets/actor/party/party-overview-${this.theme}`, context);
        break;
      case "character":
        break;

      case "inventory": {
        context.tables = [
          await this.#equipmentTableRenderer.render(this.actor.getItemsByType("weapon", "armor", "accessory", "consumable")),
        ];
      }
        break;
      case "codex": {
        await this.codexBrowser.prepareContext(context);
        await this.codexBrowser.enrichDescriptions();
        break;
      }
    }
    return context;
  }

  /**
   * Attach event listeners to rendered template parts.
   * @param {string} partId The id of the part being rendered.
   * @param {HTMLElement} html The rendered HTML element for the part.
   * @param {ApplicationRenderOptions} options Rendering options passed to the render method.
   * @protected
   */
  _attachPartListeners(partId, html, options) {
    super._attachPartListeners(partId, html, options);
    switch (partId) {
      case "overview": {
        this.setupCharacterContextMenu(html);
        break;
      }

      case "codex":
      {
        this.codexBrowser.attachListeners(html);
        break;
      }
    }
  }

  /**
   * @description Sets up a context menu for characters in the overview
   * @param html
   */
  setupCharacterContextMenu(html) {
    // Don't provide this context menu to players
    if (!game.user.isGM) {
      return;
    }

    // Initialize the context menu options
    let contextMenuOptions = [
      {
        name: StringUtils.localize("AH.COMMON.Delete"),
        icon: "<i class=\"fas fa-trash\"></i>",
        callback: (el) => {
          const id = el.dataset.uuid;
          const type = el.dataset.type;
          switch (type) {
            case "character":
              this.system.removeHero(id);
              break;
          }
        },
      },
    ];

    FoundryUtils.contextMenu(html, ".character-option", contextMenuOptions, "contextmenu");
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
    this.codexBrowser.refresh(this.actor, this.element);
  }

  /**
   * @override
   */
  async _onDropActor(event, actor) {
    if (actor.type === "hero") {
      ui.notifications.info(`Dropped ${actor.name}`);
      await this.system.addHero(actor);
    }
    return null;
  }

  async _onDropItem(event, item) {
    return super._onDropItem(event, item);
  }

  async _onDropActiveEffect(event, effect) {
    ui.notifications.warn("Active effects are not supported in the party sheet.");
    return null;
  }

  /*-----------------------------------------------------------------*/

  /**
   * @this PartySheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @returns {Promise<void>}
   */
  static async #addCodexEntry(event, target) {
    return this.codexBrowser.addCodexEntry();
  }

  /**
   * @this PartySheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @returns {Promise<void>}
   */
  static async #onCodexEntry(event, target) {
    return this.codexBrowser.handleContextAction(event, target);
  }

  /**
   * @this PartySheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @returns {Promise<void>}
   */
  static async #onImportCodexActorEntry(event, target) {
  }

  /**
   * @this PartySheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @returns {Promise<void>}
   */
  static async #onImportCodexJournalEntry(event, target) {
  }

  /**
   * @this PartySheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @returns {Promise<void>}
   */
  static async #onResetCodexTags(event, target) {
    return this.codexBrowser.resetTags();
  }

  /**
   * @this PartySheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @returns {Promise<void>}
   */
  static async #revealActor(event, target) {
    const uuid = target.dataset.actor;
    const actor = fromUuidSync(uuid);
    if (actor) {
      actor.sheet.render(true);
    } else {
      const type = target.dataset.type;
      switch (type) {
        case "character":
          this.system.removeHero(uuid);
          break;
      }
    }
  }

  static initialize() {

    /**
     * @param {AHCombat} combat
     * @param {CombatUpdateData} updateData
     * @param updateOptions
     */
    const onCombatStart = (combat, updateData, updateOptions) => {
      const actors = combat.actors;
      const party = PartySheet.getActiveActor();
      if (party) {
        for (const actor of actors.filter((a) => a.type === "adversary")) {
          party.system.addOrUpdateAdversary(actor, 0);
        }
      }
    };

    Hooks.on(AH.hooks.foundry.combat.combatStart, onCombatStart);

    /**
     * @type {RegisterKeybindings}
     */
    const onRegisterKeybindings = (entries) => {
      entries.openPartySheet = {
        name: "AH.SHEET.Party",
        editable: [
          { key: "KeyP" },
        ],
        onDown: () => {
          PartySheet.toggleActive();
          return true;
        },
      };
    };

    Hooks.on(AH.hooks.REGISTER_KEYBINDINGS, onRegisterKeybindings);
  }
}
