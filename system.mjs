import * as common from "./src/module/data/common/_module.mjs";
import * as apps from "./src/module/apps/_module.mjs";
import * as data from "./src/module/data/_module.mjs";
import * as documents from "./src/module/documents/_module.mjs";
import * as helpers from "./src/module/helpers/_module.mjs";
import * as pipelines from "./src/module/pipelines/_module.mjs";
import AH from "./src/module/config.mjs";
import { localizeHelper } from "./src/module/utils/utils.mjs";
import { systemID } from "./src/module/constants.mjs";

/**
 * Exports the API so that it can be used at runtime
 */
function exportAPI() {
  globalThis.azureHorizon = {
    data,
    helpers,
    documents,
    index: data.Compendium.CompendiumIndex.instance,
    registries: AH.dataModelRegistries,
  };
}

/**
 * Binds the documents by the system.
 */
function bindDocuments() {
  for (const docCls of Object.values(documents)) {
    if (!foundry.utils.isSubclass(docCls, foundry.abstract.Document)) continue;
    CONFIG[docCls.documentName].documentClass = docCls;
  }
}

/**
 * Binds the custom data models used by the system.
 */
function bindDataModels() {
  Object.assign(CONFIG.Actor.dataModels, data.Actor.dataModels);
  Object.assign(CONFIG.Combatant.dataModels, data.Combatant.dataModels);
  Object.assign(CONFIG.Item.dataModels, data.Item.dataModels);
  Object.assign(CONFIG.ActiveEffect.dataModels, data.ActiveEffect.dataModels);
  CONFIG.Actor.defaultType = "basic";
  CONFIG.Token.hudClass = apps.HUD.AHTokenHUD;
  CONFIG.statusEffects = data.ActiveEffect.statusEffects.values;
  CONFIG.specialStatusEffects.DEFEATED = "ko";

}

/**
 * Binds document sheets to be used.
 */
function bindSheets() {
  // Destructuring some pieces for simplification
  const { ActiveEffect } = foundry.documents;
  const { Actors, Items, Journal } = foundry.documents.collections;
  const { DocumentSheetConfig } = foundry.applications.apps;
  // Document Sheets
  Actors.registerSheet("ah", apps.Actor.AHActorSheet, {
    makeDefault: true, label: "AH.SHEET.Labels.ActorSheet",
  });
  Actors.registerSheet("ah", apps.Actor.HeroSheet, {
    types: ["hero"],
    makeDefault: true,
    label: "AH.SHEET.Labels.HeroSheet",
  });
  Actors.registerSheet("ah", apps.Actor.AdversarySheet, {
    types: ["adversary"],
    makeDefault: true,
    label: "AH.SHEET.Labels.AdversarySheet",
  });
  Actors.registerSheet("ah", apps.Actor.PartySheet, {
    types: ["party"],
    makeDefault: true,
    label: "AH.SHEET.Labels.PartySheet",
  });
  Actors.registerSheet("ah", apps.Actor.FollowerSheet, {
    types: ["follower"],
    makeDefault: true,
    label: "AH.SHEET.Labels.FollowerSheet",
  });
  Items.registerSheet("ah", apps.Item.AHItemSheet, {
    makeDefault: true, label: "AH.SHEET.Labels.ItemSheet",
  });
  DocumentSheetConfig.unregisterSheet(ActiveEffect, "core", foundry.applications.sheets.ActiveEffectConfig);
  DocumentSheetConfig.registerSheet(ActiveEffect, systemID, apps.ActiveEffect.AHActiveEffectConfig, {
    makeDefault: true,
  });
}

/**
 * Initializes the system's subsystems.
 */
async function initializeSystems() {
  helpers.Settings.initialize();
  helpers.Themes.initialize();
  helpers.AHHandlebars.loadTemplates();
  helpers.AHHandlebars.registerHelpers();
  helpers.AHHandlebars.registerPartials();
  data.Compendium.CompendiumIndex.initialize();
  pipelines.Enrichers.initialize();
  pipelines.Damage.initialize();
  pipelines.Resources.initialize();
  pipelines.Effects.initialize();
  pipelines.Rules.initialize();
  pipelines.Actions.initialize();
  apps.UI.CompendiumBrowser.initialize();
  // We initialize the controls last as they will call a registration hook
  apps.API.SystemControls.initialize();
}

/**
 * Sets the data model registries.
 */
function registerDataModels() {
  /**
   * @type {Record<string, DataModelRegistry>}
   * @property {RuleActionRegistry} ruleAction
   * @property {RulePredicateRegistry} rulePredicate
   * @property {RuleTriggerRegistry} ruleTrigger
   * @property {RuleElementDataModel} ruleElement
   */
  AH.dataModelRegistries = {
    ruleElement: data.ActiveEffect.Registries.RuleElementRegistry.instance,
    ruleAction: data.ActiveEffect.Registries.RuleActionRegistry.instance,
    ruleTrigger: data.ActiveEffect.Registries.RuleTriggerRegistry.instance,
    rulePredicate: data.ActiveEffect.Registries.RulePredicateRegistry.instance,
    classFeature: data.Item.ClassFeatureRegistry.instance,
  };
  /**
   * @type {String[]}
   */
  AH.dataModelTemplates = data.ActiveEffect.templates;
}

Hooks.once("init", function() {
  bindDocuments();
  registerDataModels();
  bindDataModels();
  bindSheets();
  initializeSystems();

  // Sidebar tabs
  CONFIG.ui.combat = apps.Combat.AHCombatTracker;
  CONFIG.AH = AH;

  exportAPI();
});

Hooks.once("i18nInit", () => {
  // Localizing the system's CONFIG object
  localizeHelper(CONFIG.AH);
});

Hooks.on("renderCombatantConfig", apps.Combatant.hooks.renderCombatantConfig);
