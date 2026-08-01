import { systemTemplatePath } from "../../constants.mjs";
import {
  RuleActionRegistry,
  RuleElementDataModel,
  RulePredicateRegistry,
  RuleTriggerRegistry,
} from "../../data/effect/_module.mjs";
import AH from "../../config.mjs";
import { FoundryUtils } from "../../utils/_module.mjs";

export default class AHActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

  #expandedRules = {};

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ah-application"],
    actions: {
    },
    form: {
      closeOnSubmit: false,
    },
  };

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: "templates/sheets/active-effect/header.hbs",
    },
    tabs: {
      template: "templates/generic/tab-navigation.hbs",
    },
    details: { template: "templates/sheets/active-effect/details.hbs", scrollable: [""] },
    duration: { template: "templates/sheets/active-effect/duration.hbs" },
    rules: {
      template: systemTemplatePath("sheets/effect/active-effect-rules"),
      templates: Object.values(RuleActionRegistry.instance.qualifiedTypes)
        .map((pt) => {
          return pt.template;
        })
        .concat(
          Object.values(RuleTriggerRegistry.instance.qualifiedTypes).map((pt) => {
            return pt.template;
          }),
        )
        .concat(
          Object.values(RulePredicateRegistry.instance.qualifiedTypes).map((pt) => {
            return pt.template;
          }),
        )
        .concat([RuleElementDataModel.template]),
    },
    changes: {
      template: "templates/sheets/active-effect/changes.hbs",
      templates: ["templates/sheets/active-effect/change.hbs"],
      scrollable: ["ol[data-changes]"],
    },
    footer: { template: "templates/generic/form-footer.hbs" },
  };

  /** @override */
  static TABS = {
    sheet: {
      tabs: [
        { id: "details", icon: "fa-solid fa-book" },
        { id: "duration", icon: "fa-solid fa-clock" },
        { id: "rules", label: "AH.RULE.Rule.plural", icon: "fa-solid fa-list", cssClass: "scrollable" },
        { id: "changes", icon: "fa-solid fa-gears" },
      ],
      initial: "details",
      labelPrefix: "EFFECT.TABS",
    },
  };

  /**
   * @returns {ActiveEffectModel}
   */
  get system() {
    return this.document.system;
  }

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.systemFields = this.document.system.schema.fields;
    context.effect = this.document;
    context.system = this.document.system;
    let parent = this.document.parent;
    while (parent != null) {
      if ((parent.type === "character") || (parent.type === "npc")) {
        context.actor = parent;
      } else if (parent.type === "item") {
        context.item = parent;
      }
      parent = parent.parent;
    }
    for (const re of this.system.rules) {
      await re.prepareRenderContext(context);
    }

    context.expandedRules = this.#expandedRules;
    return context;
  }

  /** @inheritDoc */
  async _preparePartContext(partId, context) {
    const partContext = await super._preparePartContext(partId, context);
    switch (partId) {
      case "duration":
        {
          context.effectDuration = AH.effectDuration;
          context.effectTracking = AH.effectTracking;
        }
        break;

      case "rules":
        {
          context.options = {
            ...AH,
            ruleActions: RuleActionRegistry.instance.localizedEntries,
            ruleTriggers: RuleTriggerRegistry.instance.localizedEntries,
            itemGroupOptions: FoundryUtils.getFormSelectOptions(AH.itemGroup),
            checkTypeOptions: FoundryUtils.getFormSelectOptions(AH.checkTypes),
            rankOptions: FoundryUtils.getFormSelectOptions(AH.rank),
          };
        }
        break;
    }
    return partContext;
  }

}
