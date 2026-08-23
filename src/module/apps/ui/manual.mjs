import AH from "../../config.mjs";
import { CompendiumIndex } from "../../data/compendium/_module.mjs";

/**
 * Initializes the manuals.
 */
function initialize() {
  /**
   * @param {SystemControlTool[]} tools
   */
  const onGetSystemTools = (tools) => {
    tools.push({
      name: "AH.APPLICATION.MANUAL.Manual",
      icon: "ra ra-scroll-unfurled",
      onClick: async () => {
        const manual = await CompendiumIndex.instance.getManualEntries();
        const journal = await fromUuid(manual.rules.uuid);
        journal?.sheet.render({ force: true });
      },
    });
    tools.push({
      name: "AH.APPLICATION.MANUAL.Glossary",
      icon: "fa-solid fa-spell-check",
      onClick: async () => {
        const manual = await CompendiumIndex.instance.getManualEntries();
        const journal = await fromUuid(manual.glossary.uuid);
        journal?.sheet.render({ force: true });
      },
    });
    if (game.user.isGM) {
      tools.push({
        name: "AH.APPLICATION.MANUAL.DirectorGuide",
        icon: "ra ra-monster-skull",
        onClick: async () => {
          const manual = await CompendiumIndex.instance.getManualEntries();
          const journal = await fromUuid(manual.director.uuid);
          journal?.sheet.render({ force: true });
        },
      });
    }
    else {
      tools.push({
        name: "AH.APPLICATION.MANUAL.PlayerGuide",
        icon: "ra ra-campfire",
        onClick: async () => {
          const manual = await CompendiumIndex.instance.getManualEntries();
          const journal = await fromUuid(manual.player.uuid);
          journal?.sheet.render({ force: true });
        },
      });
    }
  };

  Hooks.on(AH.hooks.REGISTER_SYSTEM_TOOLS, onGetSystemTools);

  /**
   * @type {RegisterKeybindings}
   */
  const onRegisterKeybindings = (entries) => {

    entries.openManual = {
      name: "AH.APPLICATION.MANUAL.Manual",
      editable: [
        { key: "F1" },
      ],
      onDown: async () => {
        const manual = await CompendiumIndex.instance.getManualEntries();
        const journal = await fromUuid(manual.rules.uuid);
        if (journal.sheet.rendered) {
          journal.sheet.close();
        }
        else {
          journal?.sheet.render({ force: true });
        }

        return true;
      },
    };
  };

  Hooks.on(AH.hooks.REGISTER_KEYBINDINGS, onRegisterKeybindings);
}

const Manual = Object.freeze({
  initialize,
});

export default Manual;
