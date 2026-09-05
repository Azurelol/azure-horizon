import { AHActorSheet } from "./actor-sheet.mjs";
import {
  getSystemSetting,
  renderTemplate,
  setSystemSetting,
  systemPath,
  systemTemplatePath,
} from "../../constants.mjs";
import { CodexBrowser } from "../ui/_module.mjs";
import { ActionTableRenderer, EquipmentTableRenderer } from "../item/_module.mjs";
import { CharacterSheet } from "./character-sheet.mjs";
import { FoundryUtils, StringUtils } from "../../utils/_module.mjs";
import AH from "../../config.mjs";
import { Campaign } from "../../pipelines/_module.mjs";
import { ExperienceTableRenderer } from "../campaign/_module.mjs";
import { ChatAction, ChatMessageBuilder } from "../../helpers/_module.mjs";
import { Formulas } from "../../ruleset/_module.mjs";

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
      inspectCharacter: this.#inspectCharacter,

      triggerExperience: this.#triggerExperience,
      levelUp: this.#levelUp,

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
        { id: "campaign", label: "AH.SHEET.Tabs.Campaign", icon: "ra ra-wooden-sign", gm: true },
        { id: "settings", label: "AH.SHEET.Tabs.Settings", icon: "ra ra-candle" },
      ],
      initial: "overview",
    },
    campaign: {
      tabs: [
        { id: "opening", label: "AH.SHEET.Tabs.Opening", icon: "ra ra-double-team" },
        { id: "ending", label: "AH.SHEET.Tabs.Ending", icon: "ra ra-double-team" },
      ],
      initial: "opening",
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
    campaign: {
      template: systemTemplatePath("sheets/actor/party/party-campaign"),
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
    context.tabs = this._prepareTabs("primary");
    return context;
  }

  #equipmentTableRenderer = new EquipmentTableRenderer({ title: "AH.ITEM.Equipment", actions: AHActorSheet.getCompendiumTableActions("equipment"), preview: true, stash: true });
  #experienceTableRenderer = new ExperienceTableRenderer({ title: "AH.EXPERIENCE.Triggers" });

  /** @inheritdoc */
  async _preparePartContext(partId, ctx, options) {
    const context = await super._preparePartContext(partId, ctx, options);
    // IMPORTANT: Set the active tab
    if (partId in context.tabs) context.tab = context.tabs[partId];
    switch (partId) {
      case "tabs":
        break;
      case "overview":
        context.characters = await this.system.getHeroes();
        context.overview = await renderTemplate(`sheets/actor/party/party-overview-${this.theme}`, context);
        break;
      case "character":
        break;
      case "campaign": {
        context.campaignTabs = this._prepareTabs("campaign");
        context.opening = Campaign.prepareOpeningData(this.system);
        const ending = await Campaign.prepareEndingData(this.system);
        context.ending = ending;
        let tables = [];
        for (const group of Object.values(ending.groups)) {
          let actions;
          if (group.heroes) {
            actions = group.heroes.map(hero => {
              return new ChatAction("revealActor", null, hero.name).withImage(hero.actor.img);
            });
          }
          //TODO: Add hero imgs
          const tr = new ExperienceTableRenderer({ title: group.label, actions: actions,
            data: {
            } });
          const tb = await tr.render(group.triggers);
          tables.push(tb);
        }
        context.experienceTables = tables;
        break;
      }
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
        name: StringUtils.localize("AH.COMMON.Remove"),
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

  /**
   * @this PartySheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #inspectCharacter(event, target) {
    const uuid = target.dataset.actor;
    const actor = fromUuidSync(uuid);
    if (actor) {
      actor.sheet.render(true);
    }
    // TODO: Add character-only tab
    // const character = this.system.constructCharacterData(actor);
    // if (character) {
    //   this.inspectedCharacter = character;
    //   this.render(true, {
    //     tab: 'character',
    //   });
    // }
  }

  /**
   * @this PartySheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @returns {Promise<void>}
   */
  static async #triggerExperience(event, target) {
    const { text, amount } = target.dataset;
    const builder = new ChatMessageBuilder(this.actor, null);
    builder.template("chat/chat-section-experience-trigger", {
      text: text,
      name: "Party",
      amount: amount,
    });
    const current = this.actor.system.resources.xp;
    this.actor.update({
      ["system.resources.xp"]: current + Number(amount),
    });
    return builder.create();
  }

  /**
   * @this PartySheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @returns {Promise<void>}
   */
  static async #levelUp(event, target) {
    const total = this.actor.system.resources.xp;
    const lc = Formulas.calculateLevelsGained(total);
    if (lc.levelsGained === 0) {
      ui.notifications.warn("The party does not have enough experience to level up!");
      return;
    }

    const heroes = await this.system.getHeroes();
    for (const hero of heroes) {
      const hl = hero.actor.system.level;
      await hero.actor.update({
        ["system.level"]: hl + lc.levelsGained,
      });
    }

    const builder = new ChatMessageBuilder(this.actor, null);
    builder.text(`The party gained ${lc.levelsGained} levels!`);
    this.actor.update({
      ["system.resources.xp"]: lc.remainingExperience,
    });
    return builder.create();
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
