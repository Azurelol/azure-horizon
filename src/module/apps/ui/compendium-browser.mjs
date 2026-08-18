import { AHApplication } from "../api/_module.mjs";
import { CompendiumIndex } from "../../data/compendium/_module.mjs";
import AH from "../../config.mjs";

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
      contentClasses: [""],
      resizable: true,
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
    position: { width: 800, height: "800" },
    actions: {
      refreshIndex: this.refreshIndex,
    },
  };

  /** @override
   * @type Record<ApplicationTab>
   * */
  static TABS = {
    primary: {
      tabs: [
        { id: "classes", label: "AH.COMPENDIUM.classes", icon: "ra ra-player" },
        { id: "equipment", label: "AH.COMPENDIUM.equipment", icon: "ra ra-anvil" },
        { id: "spells", label: "AH.COMPENDIUM.spells", icon: "ra ra-fairy-wand" },
        { id: "adversaries", label: "AH.COMPENDIUM.adversaries", icon: "ra ra-monster-skull" },
        { id: "assembly", label: "AH.COMPENDIUM.assembly", icon: "ra ra-bird-claw" },
        { id: "effects", label: "AH.COMPENDIUM.effects", icon: "ra ra-droplet-splash" },
      ],
      initial: "classes",
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
  }

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
}
