import AH, { getFormSelectOptions } from "../../config.mjs";
import { CompendiumIndex } from "../../data/compendium/_module.mjs";
import { Dialogs } from "../../helpers/_module.mjs";
import { StringUtils } from "../../utils/_module.mjs";

async function openManual() {
  const manual = await CompendiumIndex.instance.getManualEntries();
  if (manual) {
    const title = "AH.APPLICATION.MANUAL.Manual";
    const result = await Dialogs.itemSelect(
      {
        title: title,
        style: "grid",
        max: 1,
        classes: "--text",
        quick: true,
        items: Object.values(manual),
        getDescription: async (item) => {
          return "";
        },
      },
    );
    const option = result[0];
    //const option = await Dialogs.select(title, formOptions);

    if (option) {
      //const entry = manual[option];
      const journal = await fromUuid(option.uuid);
      journal?.sheet.render({ force: true });
    }
  }
}

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
        return openManual();
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
    tools.push({
      name: "AH.APPLICATION.MANUAL.PlayerGuide",
      icon: "ra ra-campfire",
      onClick: async () => {
        const manual = await CompendiumIndex.instance.getManualEntries();
        const journal = await fromUuid(manual.player.uuid);
        journal?.sheet.render({ force: true });
      },
    });
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
        await openManual();
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
