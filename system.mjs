import * as apps from "./src/module/apps/_module.mjs";
import * as dataModels from "./src/module/data/_module.mjs";
import * as documents from "./src/module/documents/_module.mjs";
import AH from "./src/module/config.mjs";
import { localizeHelper } from "./src/module/helpers/utils.mjs";

Hooks.once("init", () => {
  CONFIG.AH = AH;

  // Assign document classes
  for (const docCls of Object.values(documents)) {
    CONFIG[docCls.documentName].documentClass = docCls;
  }

  Object.assign(CONFIG.Actor.dataModels, dataModels.Actor.config);
  Object.assign(CONFIG.Combatant.dataModels, dataModels.Combatant.config);

  CONFIG.Actor.defaultType = "token";

  // Document Sheets
  foundry.documents.collections.Actors.registerSheet("ah", apps.Actor.AHActorSheet, {
    makeDefault: true, label: "AH.Sheets.Labels.ActorSheet",
  });
  foundry.documents.collections.Items.registerSheet("ah", apps.Item.AHItemSheet, {
    makeDefault: true, label: "AH.Sheets.Labels.ActorSheet",
  });

  // Sidebar tabs
  CONFIG.ui.combat = apps.Combat.AHCombatTracker;
});

Hooks.once("i18nInit", () => {
  // Localizing the system's CONFIG object
  localizeHelper(CONFIG.AH);
});

Hooks.on("renderCombatantConfig", apps.Combatant.hooks.renderCombatantConfig);
