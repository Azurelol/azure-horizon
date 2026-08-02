import { systemTemplatePath } from "../../constants.mjs";
import {
  RuleElementDataModel,
} from "../../data/effect/_module.mjs";
import AH from "../../config.mjs";
import { FoundryUtils, StringUtils } from "../../utils/_module.mjs";
import { Dialogs } from "../../helpers/_module.mjs";
import { SubDocumentCollectionField } from "../../data/api/_module.mjs";

export default class AHActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

  #expandedRules = {};

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ah-application"],
    actions: {
      addRuleElement: this.#addRuleElement,
      deleteRuleElement: this.#deleteRuleElement,
      clearRuleElements: this.#clearRuleElements,
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
      templates: AH.dataModelTemplates,
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
            ruleActions: AH.dataModelRegistries.ruleAction.localizedEntries,
            ruleTriggers: AH.dataModelRegistries.ruleTrigger.localizedEntries,
            itemGroupOptions: FoundryUtils.getFormSelectOptions(AH.itemGroup),
            checkTypeOptions: FoundryUtils.getFormSelectOptions(AH.checkTypes),
            rankOptions: FoundryUtils.getFormSelectOptions(AH.rank),
          };
        }
        break;
    }
    return partContext;
  }

  /**
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #addRuleElement(event, target) {
    const triggerTypes = AH.dataModelRegistries.ruleTrigger.localizedEntries;
    const options = FoundryUtils.getFormSelectOptions(triggerTypes);
    const type = await Dialogs.select(
      StringUtils.localize("AH.COMMON.Add", {
        element: StringUtils.localize("AH.RULE.Element"),
      }),
      options,
    );

    const triggerModel = AH.dataModelRegistries.ruleTrigger.instance.types[type];
    const trigger = new triggerModel();
    const data = {
      trigger: trigger,
    };
    await SubDocumentCollectionField.addModel(this.document.system.rules, RuleElementDataModel.TYPE, this.document, data);
    console.debug(`Added rule element with trigger ${type}`);
  }

  /**
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #deleteRuleElement(event, target) {
    const { id } = target.dataset;
    console.debug(`Deleting rule element ${id}`);
    /** @type RuleElementDataModel **/
    const re = this.document.system.rules.get(id);
    if (re) {
      const confirm = await Dialogs.confirm(
        {
          title: "AH.COMMON.Remove",
          message: StringUtils.localize("AH.DIALOG.RemoveObject", { label: re.localization }),
        });
      if (confirm) {
        await re.delete();
      }
    }
  }

  /**
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #clearRuleElements(event, target) {
    const confirm = await Dialogs.confirm({
      title: "AH.COMMON.Clear",
      message: StringUtils.localize("AH.DIALOG.ClearObjects"),
    });
    if (confirm) {
      await this.document.update({
        "system.==rules": {},
      });
    }
  }

}
