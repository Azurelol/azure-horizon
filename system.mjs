import * as apps from "./src/module/apps/_module.mjs";
import * as data from "./src/module/data/_module.mjs";
import * as documents from "./src/module/documents/_module.mjs";
import * as helpers from "./src/module/helpers/_module.mjs";
import AH from "./src/module/config.mjs";
import { localizeHelper } from "./src/module/utils/utils.mjs";

globalThis.ah = {
  data,
  helpers,
  documents,
};

function bindDocuments() {
  for (const docCls of Object.values(documents)) {
    if (!foundry.utils.isSubclass(docCls, foundry.abstract.Document)) continue;
    CONFIG[docCls.documentName].documentClass = docCls;
  }
}

function bindDataModels() {
  Object.assign(CONFIG.Actor.dataModels, data.Actor.dataModels);
  Object.assign(CONFIG.Combatant.dataModels, data.Combatant.dataModels);
  Object.assign(CONFIG.Item.dataModels, data.Item.dataModels);
  Object.assign(CONFIG.ActiveEffect.dataModels, data.ActiveEffect.dataModels);
  CONFIG.Actor.defaultType = "basic";
}

function bindSheets() {
  // Document Sheets
  foundry.documents.collections.Actors.registerSheet("ah", apps.Actor.AHActorSheet, {
    makeDefault: true, label: "AH.Sheets.Labels.ActorSheet",
  });
  foundry.documents.collections.Items.registerSheet("ah", apps.Item.AHItemSheet, {
    makeDefault: true, label: "AH.Sheets.Labels.ItemSheet",
  });
}

async function initializeSystems() {
  helpers.Settings.initialize();
  helpers.Themes.initialize();
  await helpers.AHHandlebars.loadTemplates();
  await helpers.AHHandlebars.registerHelpers();
}

Hooks.once("init", async () => {
  CONFIG.AH = AH;

  bindDocuments();
  bindDataModels();
  bindSheets();
  await initializeSystems();

  // Sidebar tabs
  CONFIG.ui.combat = apps.Combat.AHCombatTracker;
});

Hooks.once("i18nInit", () => {
  // Localizing the system's CONFIG object
  localizeHelper(CONFIG.AH);
});

Hooks.on("renderCombatantConfig", apps.Combatant.hooks.renderCombatantConfig);
