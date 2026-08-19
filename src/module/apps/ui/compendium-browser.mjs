import { AHApplication } from "../api/_module.mjs";
import { CompendiumIndex } from "../../data/compendium/_module.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";
import { systemTemplatePath } from "../../constants.mjs";
import { CompendiumFilter } from "./compendium-filter.mjs";
import { HTMLUtils } from "../../utils/_module.mjs";
import {
  ActionTableRenderer,
  ArmorTableRenderer,
  AttackTableRenderer,
  EquipmentTableRenderer,
  WeaponTableRenderer,
} from "../item/_module.mjs";
import { AdversaryTableRenderer, FollowerTableRenderer } from "../actor/_module.mjs";
import { EffectTableRenderer } from "../effect/_module.mjs";

/**
 * @typedef {"classes"|"skills"|"equipment"|"spells"|"adversaries"|"assembly"|"followers"|"effects"} CompendiumBrowserTab
 */

/**
 * Used for opening the system's compendiums.
 */
export default class CompendiumBrowser extends AHApplication {
  /**
   * @inheritDoc
   * @type ApplicationConfiguration
   * @override
   */
  static DEFAULT_OPTIONS = {
    window: {
      title: "AH.APPLICATION.CompendiumBrowser",
      icon: "fas fa-book",
      resizable: true,
      contentClasses: ["ah-application__browser"],
      controls: [
        {
          action: "refreshIndex",
          icon: "fa-regular fa-refresh",
          label: "AH.COMMON.Refresh",
          ownership: "OWNER",
        },
      ],
    },
    form: { closeOnSubmit: false },
    position: { width: 900, height: "800" },
    actions: {
      refreshIndex: this.refreshIndex,
      performAction: this.#performAction,
    },
  };

  /**
   * Initializes the compendium browser, registering its menu.
   */
  static initialize() {
    /**
     * @param {SystemControlTool[]} tools
     */
    const onGetSystemTools = (tools) => {
      tools.push({
        name: "AH.APPLICATION.CompendiumBrowser",
        icon: "fa-solid fa-book",
        onClick: () => {
          CompendiumBrowser.instance.render(true);
        },
      });
    };

    Hooks.on(AH.hooks.REGISTER_SYSTEM_TOOLS, onGetSystemTools);

    /**
     * @type {RegisterKeybindings}
     */
    const onRegisterKeybindings = (entries) => {

      entries.openBrowser = {
        name: "AH.APPLICATION.CompendiumBrowser",
        editable: [
          { key: "KeyB", modifiers: ["Control"] },
        ],
        onDown: () => {
          CompendiumBrowser.instance.render(true);
          return true;
        },
      };
    };

    Hooks.on(AH.hooks.REGISTER_KEYBINDINGS, onRegisterKeybindings);
  }

  /**
   * @this CompendiumBrowser
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async refreshIndex(event, target) {
    CompendiumIndex.reinitialize();
    ui.notifications.info("AH.APPLICATION.MESSAGE.IndexRefresh", { localize: true });
    if (CompendiumBrowser.instance) {
      CompendiumBrowser.instance.filter.clear();
      CompendiumBrowser.instance.render(true);
    }
  }

  /**
   * @this
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #performAction(event, target) {
    event.preventDefault();

    /** @type AH_SheetActionData **/
    const { type, id } = target.dataset;
    const modifiers = HTMLUtils.getKeyboardModifiers(event);

    switch (type) {
      case "item": {
        const item = await this.actor.items.get(id);
        await item.perform(modifiers);
      }
        break;
    }
  }

  /**
   * @param {CompendiumBrowserTab} tab The initial tab to open.
   * @param {CompendiumFilterInputOptions} inputFilter Initial filtering for the tab.
   */
  static async open(tab, inputFilter) {
    const instance = CompendiumBrowser.instance;
    instance.filter.setText(inputFilter.text);
    instance.onNextTabChange((filters) => {
      if (inputFilter.type) {
        switch (tab) {
          case "classes":
          case "equipment":
          case "assembly":
          case "spells":
            filters.type.selected = [inputFilter.type];
            break;
        }
      }
      if (inputFilter.actorId) {
        const actor = fromUuidSync(inputFilter.actorId);
        if (actor) {
          const classReferences = actor.getItemsByType("class").map((i) => i.system.fuid);
          switch (tab) {
            case "classes":
            case "spells":
              filters.class.selected = classReferences;
              break;
          }
        }
      }
    });
    instance.render(true, {
      tab: tab,
    });
  }

  /** @override
   * @type Record<ApplicationTab>
   * */
  static TABS = {
    primary: {
      tabs: [
        { id: "classes", label: "AH.COMPENDIUM.classes", icon: "ra ra-player" },
        { id: "equipment", label: "AH.COMPENDIUM.equipment", icon: "ra ra-anvil" },
        { id: "spells", label: "AH.COMPENDIUM.spells", icon: "ra ra-fairy-wand" },
        { id: "assembly", label: "AH.COMPENDIUM.assembly", icon: "ra ra-bird-claw" },
        { id: "adversaries", label: "AH.COMPENDIUM.adversaries", icon: "ra ra-monster-skull" },
        { id: "followers", label: "AH.COMPENDIUM.followers", icon: "ra ra-double-team" },
        { id: "effects", label: "AH.COMPENDIUM.effects", icon: "ra ra-droplet-splash" },
      ],
      initial: "classes",
    },
  };

  /**
   * @typedef CompendiumTableData
   * @property {String} id
   * @property {CompendiumIndexEntry[]} entries
   * @property {String} html
   * @property {Set<String>} visible The visible entries, by their _id property.
   */

  /**
   * @typedef CompendiumTabData
   * @property {CompendiumTableData[]} tables
   * @property {CompendiumFilterCategory[]} filters
   */

  /**
   * @type {CompendiumTabData}
   */
  #tabData;

  /**
   * @returns {CompendiumTabData}
   */
  getTabData() {
    if (!this.#tabData) {
      return {
        tables: [],
        filters: {},
      };
    }
    return this.#tabData;
  }

  /**
   * @override
   */
  static PARTS = {
    // Layout
    tabs: {
      template: systemTemplatePath("sheets/document-tabs"),
    },
    sidebar: {
      template: systemTemplatePath("apps/compendium-browser/compendium-browser-sidebar"),
    },

    // Tabs
    classes: {
      template: systemTemplatePath("apps/compendium-browser/compendium-browser-tab"),
    },
    equipment: {
      template: systemTemplatePath("apps/compendium-browser/compendium-browser-tab"),
    },
    spells: {
      template: systemTemplatePath("apps/compendium-browser/compendium-browser-tab"),
    },
    assembly: {
      template: systemTemplatePath("apps/compendium-browser/compendium-browser-tab"),
    },
    adversaries: {
      template: systemTemplatePath("apps/compendium-browser/compendium-browser-tab"),
    },
    followers: {
      template: systemTemplatePath("apps/compendium-browser/compendium-browser-tab"),
    },
    effects: {
      template: systemTemplatePath("apps/compendium-browser/compendium-browser-tab"),
    },
  };

  constructor(data = {}, options = {}) {
    options.title = "AH.APPLICATION.CompendiumBrowser";
    super(data, options);
    this.#filter = new CompendiumFilter();
  }

  /**
   * @type {CompendiumBrowser}
   */
  static #instance;

  /**
   * @returns {CompendiumBrowser}
   */
  static get instance() {
    if (!CompendiumBrowser.#instance) {
      CompendiumBrowser.#instance = new CompendiumBrowser({}, {});
    }
    return CompendiumBrowser.#instance;
  }

  /**
   * @type {CompendiumFilter}
   */
  #filter;

  /**
   * @returns {CompendiumFilter}
   */
  get filter() {
    return this.#filter;
  }

  /**
   * @returns {CompendiumIndex}
   * @remarks The index is statically cached.
   */
  get index() {
    return CompendiumIndex.instance;
  }

  /** @inheritdoc */
  async _onClose(options) {
    this.filter.clear();
    return super._onClose(options);
  }

  /** @inheritdoc */
  _prepareTabs(group) {
    const tabs = super._prepareTabs(group);
    if (!game.user.isGM) {
      delete tabs.adversaries;
      delete tabs.effects;
    }
    return tabs;
  }

  /** @inheritdoc */
  async _preparePartContext(partId, ctx, options) {
    const context = await super._preparePartContext(partId, ctx, options);
    if (partId in context.tabs) context.tab = context.tabs[partId];
    const tabData = this.getTabData();
    switch (partId) {
      case "tabs":
        context.tabs = this._prepareTabs("primary");
        break;

      case "sidebar":
        {
          if (tabData) {
            this.filter.setCategories(tabData.filters);
          }
          context.filter = this.filter;
        }
        break;

      case "classes":
      case "adversaries":
      case "equipment":
      case "spells":
      case "assembly":
      case "followers":
      case "effects":
        {
          context.tables = tabData.tables.map((t) => t.html);
        }
        break;
    }
    return context;
  }

  /**
   * @function
   */
  #configureFilters;

  /**
   * @param configureFilter
   */
  onNextTabChange(configureFilter) {
    this.#configureFilters = configureFilter;
  }

  /**
   * @returns {String}
   */
  get activeTabId() {
    return this.tabGroups.primary;
  }

  async _onFirstRender(context, options) {
    await super._onRender(context, options);
    await this.renderTables(this.activeTabId, true);
  }

  /**
   * @override
   * @param partId
   * @param element
   * @param options
   * @private
   */
  _attachPartListeners(partId, element, options) {
    super._attachPartListeners(partId, element, options);
    switch (partId) {
      case "sidebar":
        {
        // Text filter
          const searchInput = element.querySelector("#search");
          if (!searchInput) {
            return;
          }
          searchInput.addEventListener(
            "input",
            HTMLUtils.debounce(() => {
              const text = searchInput.value.toLowerCase() || "";
              this.filter.setText(text);
              console.debug(`[COMPENDIUM] Text updated: ${text}`);
              this.toggleCompendiumEntries();
            }, 150),
          );
          // Checkbox filters
          element.addEventListener("change", (event) => {
            const input = event.target;
            if (!(input instanceof HTMLInputElement)) return;
            if (input.type !== "checkbox") return;

            const { category, option } = input.dataset;
            if (!category || !option) return;
            this.filter.toggle(category, option, input.checked);
            console.debug(`[COMPENDIUM] Filter toggled: ${category}=${option} (${input.checked})`);
            this.toggleCompendiumEntries();
          });
        }
        break;

      case "tabs": {
        const tabs = element.querySelectorAll("[data-tab]");
        for (const tab of tabs) {
          tab.addEventListener("click", (event) => {
            const tabId = event.currentTarget.dataset.tab;
            this.renderTables(tabId);
          });
        }
        break;
      }
    }
  }

  /**
   * @typedef TableRenderingData
   * @property {CompendiumIndexEntry[]} entries
   * @property {AH_TableRenderer} renderer
   */

  /**
   * @param {TableRenderingData[]} tables
   * @param {Record<string, CompendiumFilterCategory>} filters
   */
  async onRenderTables(tables, filters) {
    let result = [];

    if (filters && (Object.keys(filters).length > 0)) {
      if (this.#configureFilters) {
        this.#configureFilters(filters);
        this.#configureFilters = undefined;
      }
    }

    this.filter.setCategories(filters);

    for (const trd of tables) {
      const html = await trd.renderer.render(trd.entries, {
        hideIfEmpty: false,
        isVisible: (item) => {
          return this.filter.filter(item);
        },
      });

      /** @type CompendiumTableData **/
      const tableData = {
        id: trd.renderer.id,
        entries: trd.entries,
        html: html,
        visible: new Set(trd.entries.map((e) => e._id)),
      };
      result.push(tableData);
    }

    this.#tabData = {
      tables: result,
      filters: filters,
    };
  }

  /**
   * @property {HTMLElement} element
   * @desc Given
   */
  toggleCompendiumEntries(element = null) {
    if (!this.#tabData) {
      console.debug("Cannot toggle compendium entries without tab data.");
      return;
    }

    const root = element ?? this.element;

    // For each of the tables currently being rendered
    for (const tableData of this.#tabData.tables) {
      // Rerun the filter on this table's entries
      tableData.visible.clear();
      const filteredEntries = tableData.entries.filter(this.filter.filter);
      for (const entry of filteredEntries) {
        tableData.visible.add(entry.uuid);
      }

      // Find active tab inside this application only
      const activeTab = root.querySelector(".tab.active");
      if (!activeTab) {
        console.warn("No active tab found.");
        return;
      }

      // Look up the table in the DOM by its data-table-id dataset property
      const selector = `#${CSS.escape(tableData.id)}`;
      const matches = activeTab.querySelectorAll(selector);
      if (matches.length > 1) {
        console.error(`More than one table with the ID ${tableData.id} was found!`);
      } else if (matches.length === 0) {
        throw Error(`Did not find the rendered table ${tableData.id} in the DOM.`);
      }

      const renderedTable = matches[0];
      if (!renderedTable) {
        throw Error(`Did not find the rendered table ${tableData.id} in the DOM.`);
      }

      // If no entries are visible, hide the table
      const showTable = filteredEntries.length > 0;
      if (showTable) {
        // Look up all its list elements
        let visibleCount = 0;
        const rowElements = renderedTable.querySelectorAll("tbody tr");
        for (const row of rowElements) {
          const uuid = row.dataset.key;
          // ✅ Check uuid exists
          if (!uuid) {
            console.error(`Missing uuid information on the list element ${row.toString()}`);
            continue;
          }
          // Toggle visibility based on filter
          const visible = tableData.visible.has(uuid);
          row.classList.toggle("hidden", !visible);
          if (visible) {
            visibleCount++;
          }
        }
        console.debug(`Compendium browser table ${tableData.id} has been updated. (${visibleCount} elements now visible).`);
      } else {
        console.debug(`Compendium browser table ${tableData.id} is now hidden.`);
      }

      renderedTable.classList.toggle("hidden", !showTable);
    }
  }

  #compendiumFilter = {
    label: "AH.COMMON.Compendium",
    propertyPath: ["packageName"],
    options: CompendiumIndex.instance.getLoadedCompendiumSourceInfo().map((info) => {
      return {
        value: info.id,
        label: info.title,
      };
    }),
  };

  // Heroes
  #classTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.Class.long", preview: true });
  #classFeatureTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.ClassFeature", preview: true });
  #skillTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.Skill", preview: true });
  #spellTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.Spell.long", preview: true });
  #weaponTableRenderer = new WeaponTableRenderer({ title: "AH.ITEM.Weapon", preview: true });
  #armorTableRenderer = new ArmorTableRenderer({ title: "AH.ITEM.Armor", preview: true });
  #accessoryTableRenderer = new EquipmentTableRenderer({ title: "AH.ITEM.Accessory", preview: true });
  #consumableTableRenderer = new ActionTableRenderer({ title: "AH.ITEM.Consumable", preview: true });
  // Adversaries
  #attackTableRenderer = new AttackTableRenderer({ title: "AH.ADVERSARY.Attack.plural", preview: true });
  #abilityTableRenderer = new ActionTableRenderer({ title: "AH.ADVERSARY.Ability.plural", preview: true });
  #adversaryTableRenderer = new AdversaryTableRenderer({ title: "AH.COMPENDIUM.adversaries", preview: true });
  // Followers
  #moveTableRenderer = new AttackTableRenderer({ title: "AH.FOLLOWER.Move.plural", preview: true });
  #followerTableRenderer = new FollowerTableRenderer({ title: "AH.COMPENDIUM.followers", preview: true });
  // Effects
  #effectTableRenderer = new EffectTableRenderer({ title: "AH.COMPENDIUM.effects", preview: true });

  /**
   *
   * @param {String} tabId
   * @param {Boolean} force
   * @param {Boolean} sidebar
   * @returns {Promise<void>}
   */
  async renderTables(tabId, force = false, sidebar = true) {
    if (this.activeTabId === (tabId && !force)) {
      return;
    }
    this.filter.clear();
    switch (tabId) {
      case "classes":
        {
          const classEntries = await this.index.getClassEntries();
          const classOptions = classEntries.class
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => ({
              value: c.system.slug,
              label: c.name,
            }));
          await this.onRenderTables(
            [
              {
                entries: classEntries.class,
                renderer: this.#classTableRenderer,
              },
              {
                entries: classEntries.skill,
                renderer: this.#skillTableRenderer,
              },
              {
                entries: classEntries.classFeature,
                renderer: this.#classFeatureTableRenderer,
              },
            ],
            {
              type: {
                label: "AH.FIELD.Type",
                propertyPath: "type",
                options: [
                  {
                    value: "class",
                    label: "AH.FIELD.Class",
                  },
                  {
                    value: "classFeature",
                    label: "AH.ITEM.ClassFeature",
                  },
                  {
                    value: "skill",
                    label: "AH.ITEM.Skill",
                  },
                ],
              },
              class: {
                label: "AH.ITEM.Class.long",
                propertyPath: ["system.class", "metadata.class"],
                options: classOptions,
              },
              compendium: this.#compendiumFilter,
            },
          );
        }
        break;

      case "assembly":
        {
          const assembly = await this.index.getAssemblyEntries();
          await this.onRenderTables(
            [
              {
                entries: assembly.attack,
                renderer: this.#attackTableRenderer,
              },
              {
                entries: assembly.ability,
                renderer: this.#abilityTableRenderer,
              },
            ],
            {
              type: {
                label: "AH.FIELD.Type",
                propertyPath: "type",
                options: [
                  {
                    value: "attack",
                    label: "AH.ITEM.Attack.long",
                  },
                  {
                    value: "ability",
                    label: "AH.ITEM.Ability.long",
                  },
                ],
              },
              attackDamage: {
                label: "AH.FIELD.DamageType.long",
                propertyPath: CompendiumIndex.itemFields.damagePrimaryType,
                options: getFormSelectOptions(AH.damageTypes),
              },
              compendium: this.#compendiumFilter,
            },
          );
        }
        break;

      case "equipment":
        {
          const equipment = await this.index.getEquipmenEntries();
          await this.onRenderTables(
            [
              {
                entries: equipment.weapon,
                renderer: this.#weaponTableRenderer,
              },
              {
                entries: equipment.armor,
                renderer: this.#armorTableRenderer,
              },
              {
                entries: equipment.accessory,
                renderer: this.#accessoryTableRenderer,
              },
              {
                entries: equipment.consumable,
                renderer: this.#consumableTableRenderer,
              },
            ],
            {
              type: {
                label: "AH.FIELD.Type",
                propertyPath: "type",
                options: [
                  {
                    value: "weapon",
                    label: "AH.ITEM.Weapon",
                  },
                  {
                    value: "armor",
                    label: "AH.ITEM.Armor",
                  },
                  {
                    value: "accessory",
                    label: "AH.ITEM.Accessory",
                  },
                  {
                    value: "consumable",
                    label: "AH.ITEM.Consumable",
                  },
                ],
              },
              compendium: this.#compendiumFilter,
            },
          );
        }
        break;

      case "adversaries":
        {
          const actors = await this.index.getActorEntries();
          await this.onRenderTables(
            [
              {
                entries: actors.adversary,
                renderer: this.#adversaryTableRenderer,
              },
            ],
            {
              rank: {
                label: "AH.ADVERSARY.Rank",
                propertyPath: "system.profile.rank",
                options: getFormSelectOptions(AH.rank),
              },
              role: {
                label: "AH.ADVERSARY.Role",
                propertyPath: "system.profile.role",
                options: getFormSelectOptions(AH.role),
              },
              compendium: this.#compendiumFilter,
            },
          );
        }
        break;

      case "followers":
        {
          const moves = await this.index.getItemsOfType("move");
          const actors = await this.index.getActorsOfType("follower");
          await this.onRenderTables(
            [
              {
                entries: moves,
                renderer: this.#moveTableRenderer,
              },
              {
                entries: actors,
                renderer: this.#followerTableRenderer,
              },
            ],
            {
              kind: {
                label: "AH.FOLLOWER.Kind",
                propertyPath: "system.profile.kind",
                options: getFormSelectOptions(AH.followerTypes),
              },
              compendium: this.#compendiumFilter,
            },
          );
        }
        break;

      case "spells":
        {
          const spells = await this.index.getItemsOfType("spell");
          const domainOptions = getFormSelectOptions(AH.domains);
          await this.onRenderTables(
            [
              {
                entries: spells,
                renderer: this.#spellTableRenderer,
              },
            ],
            {
              class: {
                label: "AH.FIELD.Domain",
                propertyPath: "system.domain",
                options: domainOptions,
              },
              compendium: this.#compendiumFilter,
            },
          );
        }
        break;

      case "effects":
        {
          const effects = await this.index.getEffects();
          await this.onRenderTables(
            [
              {
                entries: effects,
                renderer: this.#effectTableRenderer,
              },
            ],
            {
              compendium: this.#compendiumFilter,
            },
          );
        }
        break;
    }

    let parts = [tabId];
    if (sidebar) {
      parts.push("sidebar");
    }
    this.render(false, { parts: parts });
  }

}
