import { isActorType, systemTemplatePath } from "../../constants.mjs";
import {
  RuleElementDataModel,
} from "../../data/effect/_module.mjs";
import AH from "../../config.mjs";
import { FoundryUtils, StringUtils } from "../../utils/_module.mjs";
import { Dialogs } from "../../helpers/_module.mjs";
import { SubDocumentCollectionField } from "../../data/api/_module.mjs";
import { templates as ruleTemplates } from "../../data/effect/_module.mjs";

export default class AHActiveEffectConfig extends foundry.applications.sheets.ActiveEffectConfig {

  #expandedRules = {};

  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ah-application"],
    actions: {
      addRuleElement: this.#addRuleElement,
      deleteRuleElement: this.#deleteRuleElement,
      clearRuleElements: this.#clearRuleElements,
      addRuleAction: this.#addRuleAction,
      removeRuleAction: this.#removeRuleAction,
      addRulePredicate: this.#addRulePredicate,
      removeRulePredicate: this.#removeRulePredicate,
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
      templates: ruleTemplates,
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
            damageTypeOptions: FoundryUtils.getFormSelectOptions(AH.damageTypes),
            itemGroupOptions: FoundryUtils.getFormSelectOptions(AH.itemGroup),
            checkTypeOptions: FoundryUtils.getFormSelectOptions(AH.checkTypes),
            rankOptions: FoundryUtils.getFormSelectOptions(AH.rank),
          };
        }
        break;
    }
    return partContext;
  }

  #effectKeysRequireUpdate(effectKeyOptions, targetDocument) {
    if (!effectKeyOptions) {
      return true;
    }
    const targetDocumentName = targetDocument.documentName;
    const targetDocumentType = targetDocument.type;
    const { documentName, documentType } = effectKeyOptions.dataset;
    return documentName !== targetDocumentName || documentType !== targetDocumentType;
  }

  #expandedRuleElements = {};

  /** @inheritDoc */
  async _onRender(context, options) {
    await super._onRender(context, options);
    const html = this.element;

    // CHANGES Tab
    const effectKeyOptions = html.querySelector("#effect-key-options");
    const targetDocument = this.document.target ?? this.dummyActor;

    if (this.#effectKeysRequireUpdate(effectKeyOptions, targetDocument)) {
      effectKeyOptions?.remove();
      const attributeKeys = getAttributeKeys(targetDocument);
      const datalist = document.createElement("datalist");
      datalist.id = "effect-key-options";
      datalist.dataset.documentName = targetDocument.documentName;
      datalist.dataset.documentType = targetDocument.type;

      attributeKeys.forEach((opt) => {
        const option = document.createElement("option");
        option.value = opt;
        datalist.appendChild(option);
      });

      html.appendChild(datalist);
    }

    html.querySelectorAll(".key input").forEach((el) => {
      el.setAttribute("list", "effect-key-options");
    });

    // Remove assigning statuses since we don't do that
    const statusForm = html.querySelector("div.form-group.statuses");
    statusForm.remove();

    // Add toggle handler to track expanded/contracted state for RE summaries
    const reElements = this.element.querySelectorAll(".pfu-foldout[data-rule-element]:not([data-rule-element=\"\"])"); // Selector should grab only items with a *non-empty* data-rule-element
    for (const elem of reElements) {
      if (elem instanceof HTMLDetailsElement) {
        elem.addEventListener("toggle", () => {
          this.#expandedRuleElements[elem.dataset.ruleElement] = elem.open;
        });
      }
    }
  }

  /*-------------------------------------------------------------------------*/

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

    const triggerModel = AH.dataModelRegistries.ruleTrigger.types[type];
    const trigger = new triggerModel();
    const data = {
      trigger: trigger,
      type: RuleElementDataModel.TYPE,
    };
    await SubDocumentCollectionField.addDocumentModel(this.document, this.document.system.rules, data);
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

  /**
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #addRuleAction(event, target) {
    const { id } = target.dataset;
    console.debug(`Adding rule action to ${id}`);
    const re = this.document.system.rules.get(id);
    await re.addRuleAction();
  }

  /**
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #removeRuleAction(event, target) {
    const { id, actionId } = target.dataset;
    console.debug(`Removing rule action ${actionId} from ${id}`);
    const re = this.document.system.rules.get(id);
    const action = re.getAction(actionId);
    const confirm = await Dialogs.confirm({
      title: "AH.COMMON.Remove",
      message: StringUtils.localize("AH.DIALOG.RemoveObject", {
        label: action.localization,
      }),
    });
    if (confirm) {
      await re.removeRuleAction(actionId);
    }
  }

  /**
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #addRulePredicate(event, target) {
    const { id } = target.dataset;
    console.debug(`Adding rule predicate to ${id}`);
    const re = this.document.system.rules.get(id);
    await re.addRulePredicate();
  }

  /**
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #removeRulePredicate(event, target) {
    const { id, predicateId } = target.dataset;
    console.debug(`Removing rule predicate ${predicateId} from ${id}`);
    const re = this.document.system.rules.get(id);
    const predicate = re.getPredicate(predicateId);
    const confirm = await Dialogs.confirm({
      title: "AH.COMMON.Remove",
      message: StringUtils.localize("AH.DIALOG.RemoveObject", {
        label: predicate.localization,
      }),
    });
    if (confirm) {
      await re.removeRulePredicate(predicateId);
    }
  }

}

/**
 * @returns {String[]}
 */
function getAttributeKeys(document) {
  const attributeKeys = [];

  function walk(field) {
    // Plain schema container — recurse into its sub-fields
    if (field instanceof foundry.data.fields.SchemaField) {
      for (const sub of Object.values(field.fields)) walk(sub);
      return;
    }

    // Embedded DataModel — recurse into its own schema
    if (field instanceof foundry.data.fields.EmbeddedDataField) {
      for (const sub of Object.values(field.model.schema.fields)) walk(sub);
      return;
    }

    // Array field — the array itself is a valid AE target (for push/ADD).
    // If its elements are schema-shaped, expose those paths too.
    if (field instanceof foundry.data.fields.ArrayField) {
      attributeKeys.push(field.fieldPath);
      if ((field.element instanceof foundry.data.fields.SchemaField) || (field.element instanceof foundry.data.fields.EmbeddedDataField)) {
        walk(field.element);
      }
      return;
    }

    // Leaf field (NumberField, StringField, BooleanField, etc.)
    attributeKeys.push(field.fieldPath);
  }

  if (document.system) {
    for (const field of Object.values(document.system.schema.fields)) {
      walk(field);
    }
  }

  attributeKeys.sort((a, b) => a.localeCompare(b));
  return attributeKeys;
}
