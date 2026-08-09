import { prepareActiveEffectCategories } from "../../utils/utils.mjs";
import { systemPath, systemTemplatePath } from "../../constants.mjs";
import { HTMLUtils, ObjectUtils, StringUtils } from "../../utils/_module.mjs";
import { Dialogs } from "../../helpers/_module.mjs";
import AH from "../../config.mjs";
import { CheckPrompt } from "../../helpers/check-prompt.mjs";
import { ActionHandler } from "../ui/_module.mjs";

const { api, sheets } = foundry.applications;

/**
 * @typedef ApplicationTab
 * @property {string} id         The ID of the tab. Unique per group.
 * @property {string} group      The group this tab belongs to.
 * @property {string} icon       An icon to prepend to the tab.
 * @property {string} label      Display text, will be run through `game.i18n.localize`.
 * @property {boolean} active    If this is the active tab, set with `this.tabGroups[group] === id`.
 * @property {string} cssClass   "active" or "" based on the above boolean.
 */

/**
 * @typedef HandlebarsRenderOptions
 * @property {string[]} parts                       An array of named template parts to render.
 */

/**
 * Extend the basic ActorSheet with some very simple modifications.
 * @property {AHActor} actor
 */
export class AHActorSheet extends api.HandlebarsApplicationMixin(sheets.ActorSheet) {
  /** @inheritdoc */
  static DEFAULT_OPTIONS = {
    classes: ["ah-application", "ah-sheet"],
    position: {
      width: 600,
      height: 600,
    },
    window: {
      resizable: true,
    },
    actions: {
      // TODO: Deprecate? Was used in reference implementation.
      viewDoc: this.#viewDoc,
      createDoc: this.#createDoc,
      deleteDoc: this.#deleteDoc,
      toggleEffect: this.#toggleEffect,

      addArrayElement: this.#addArrayElement,
      removeArrayElement: this.#removeArrayElement,

      performAction: this.#performAction,
      sendItem: this.#sendItem,
      editDocument: this.#editDocument,
      deleteDocument: this.#deleteDocument,
    },
    form: {
      submitOnChange: true,
    },
  };

  /* -------------------------------------------------- */

  static TABS = {
    primary: {
      tabs: [
        {
          id: "properties",
          label: "AH.SHEET.Tabs.Properties",
        },
        {
          id: "items",
          label: "AH.SHEET.Tabs.Items",
        },
        {
          id: "effects",
          label: "AH.SHEET.Tabs.Effects",
        },
      ],
      initial: "properties",
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static PARTS = {
    header: {
      template: systemTemplatePath("sheets/actor/actor-header"),
    },
    tabs: {
      template: systemTemplatePath("sheets/document-tabs"),
    },
    items: {
      template: systemTemplatePath("sheets/actor/actor-items"),
      scrollable: [""],
    },
    effects: {
      template: systemTemplatePath("sheets/document-effects"),
      scrollable: [""],
    },
  };

  /* -------------------------------------------------- */

  /** @inheritdoc */
  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.classes.push(initialized.document.type);
    return initialized;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _prepareContext(options) {
    const context = await super._prepareContext(options);

    Object.assign(context, {
      owner: this.document.isOwner,
      limited: this.document.limited,
      actor: this.actor,
      actorType: this.actor.type,
      actorFields: this.actor.schema.fields,
      system: this.actor.system,
      systemFields: this.actor.system.schema.fields,
      flags: this.actor.flags,
      config: CONFIG,
      AH: AH,
    });

    return context;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preparePartContext(partId, context) {
    // Set the active tab
    if (context.tabs && (partId in context.tabs)) {
      context.tab = context.tabs[partId];
    }

    switch (partId) {

      case "effects":
        context.effects = prepareActiveEffectCategories(this.actor.allApplicableEffects());

        break;
      case "properties":
        context.fields = this._getFields();

        break;
      case "items":
        context.itemTypes = this._getItems();

        break;
    }
    return context;
  }

  /* -------------------------------------------------- */

  /**
   * Handle a dropped Actor on the Actor Sheet.
   * @param {DragEvent} event     The initiating drop event.
   * @param {AHActor} actor         The dropped Actor document.
   * @returns {Promise<Actor|null|undefined>} A Promise resolving to an Actor identical or related to the dropped Actor
   *                                          to indicate success, or a nullish value to indicate failure or no action
   *                                          being taken.
   * @protected
   */
  async _onDropActor(event, actor) {
    return null;
  }

  /**
   * Handle a dropped Item on the Actor Sheet.
   * @param {DragEvent} event     The initiating drop event.
   * @param {Item} item           The dropped Item document.
   * @returns {Promise<Item|null|undefined>} A Promise resolving to the dropped Item (if sorting), a newly created Item,
   *                                         or a nullish value in case of failure or no action being taken.
   * @protected
   * @remarks This is copied from the V14 source.
   */
  async _onDropItem(event, item) {
    return super._onDropItem(event, item);
  }

  /**
   * Handle a dropped Active Effect on the Actor Sheet.
   * The default implementation creates an Active Effect embedded document on the Actor.
   * @param {DragEvent} event       The initiating drop event.
   * @param {ActiveEffect} effect   The dropped ActiveEffect document.
   * @returns {Promise<ActiveEffect|null|undefined>} A Promise resolving to a newly created ActiveEffect, if one was
   *                                                 created, or otherwise a nullish value.
   * @protected
   * @remarks This is copied from the V14 source.
   */
  async _onDropActiveEffect(event, effect) {
    return await super._onDropActiveEffect(event, effect);
  }

  /* -------------------------------------------------- */

  /**
   * @typedef FieldSetV1
   * @property {Boolean} fieldset
   * @property {String} legend
   * @property {FieldSetV1} outer The parent field.
   * @property {Object} value
   * @property {FieldSetV1[]} fields
   */

  /**
   * Handles the system fields for the form-fields generic.
   * @returns {FieldSetV1[]}
   */
  async _getFields() {
    const doc = this.actor;
    const source = doc._source;
    const systemFields = CONFIG.Actor.dataModels[doc.type]?.schema.fields;
    const fieldSets = [];

    // TODO: Find a clever way to handle enrichment
    for (const field of Object.values(systemFields ?? {})) {
      if (field.options?.config === false) {
        continue;
      }
      const path = `system.${field.name}`;
      if (field instanceof foundry.data.fields.SchemaField) {
        const fieldset = { fieldset: true, legend: field.label, fields: [] };
        await this.#addSystemFields(fieldset, field.fields, source, path);
        fieldSets.push(fieldset);
      } else {
        fieldSets.push({ outer: { field, value: foundry.utils.getProperty(source, path) } });
      }
    }
    return fieldSets;
  }

  /* -------------------------------------------------- */

  /**
   * Recursively add system model fields to the fieldset.
   */
  async #addSystemFields(fieldset, schema, source, _path = "system") {
    for (const field of Object.values(schema)) {
      const path = `${_path}.${field.name}`;
      if (field instanceof foundry.data.fields.SchemaField) {
        this.#addSystemFields(fieldset, field.fields, source, path);
      } else if (field.constructor.hasFormSupport) {
        fieldset.fields.push({ field, value: foundry.utils.getProperty(source, path) });
      }
    }
  }

  /* -------------------------------------------------- */

  /**
   * Adapted from Actor#itemTypes.
   */
  _getItems() {
    const types = Object.fromEntries(game.documentTypes.Item.map((t) => {
      return [t, { label: game.i18n.localize(CONFIG.Item.typeLabels[t]), items: [] }];
    }));
    for (const item of this.actor.items) {
      types[item.type].items.push(item);
    }
    // Only show Base if it's actually being used
    if (types.base.items.length === 0) delete types.base;
    return types;
  }

  /* -------------------------------------------------- */
  /**
   * @param {ApplicationRenderContext} context      Prepared context data.
   * @param {RenderOptions} options
   * @protected
   * @inheritdoc
   */
  async _onFirstRender(context, options) {
    await super._onFirstRender(context, options);
  }

  /**
   * Actions performed after any render of the Application.
   * Post-render steps are not awaited by the render process.
   * @param {ApplicationRenderContext} context      Prepared context data.
   * @param {RenderOptions} options                 Provided render options.
   * @protected
   * @inheritdoc
   */
  async _onRender(context, options) {
    await super._onRender(context, options);
    this.#disableOverrides();
  }

  /* -------------------------------------------------- */
  /*   Event handlers                                   */
  /* -------------------------------------------------- */

  /**
   * Renders an embedded document's sheet.
   *
   * @this AHActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #viewDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    doc.sheet.render(true);
  }

  /* -------------------------------------------------- */

  /**
   * Handles item deletion.
   *
   * @this AHActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @protected
   */
  static async #deleteDoc(event, target) {
    const doc = this._getEmbeddedDocument(target);
    doc.delete();
  }

  /* -------------------------------------------------- */

  /**
   * Handle creating a new Owned Item or ActiveEffect for the actor using initial data defined in the HTML dataset.
   *
   * @this AHActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #createDoc(event, target) {
    const docCls = getDocumentClass(target.dataset.documentClass);
    const docData = {
      name: docCls.defaultName({
        type: target.dataset.type,
        parent: this.actor,
      }),
    };
    for (const [dataKey, value] of Object.entries(target.dataset)) {
      if (["action", "documentClass"].includes(dataKey)) continue;
      foundry.utils.setProperty(docData, dataKey, value);
    }
    docCls.create(docData, { parent: this.actor });
  }

  /* -------------------------------------------------- */

  /**
   * Determines effect parent to pass to helper.
   *
   * @this AHActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @private
   */
  static async #toggleEffect(event, target) {
    const effect = this._getEmbeddedDocument(target);
    effect.update({ disabled: !effect.disabled });
  }

  /**
   * @this AHActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @returns {Promise<void>}
   */
  static async #addArrayElement(event, target) {
    const path = target.dataset.path;
    if (path) {
      const array = ObjectUtils.getProperty(this.actor, path);
      if (array) {
        array.push(null);
        await this.actor.update({
          [`${path}`]: array,
        });
      }
    }
  }

  /**
   * @this AHActorSheet
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @returns {Promise<void>}
   */
  static async #removeArrayElement(event, target) {
    const { path, prompt, label } = target.dataset;
    const index = Number.parseInt(target.dataset.index);
    if (path) {
      if (prompt) {
        const options = {
          title: StringUtils.localize("AH.COMMON.Remove"),
          message: StringUtils.localize("AH.DIALOG.RemoveMessage", { label: label ?? "AH.COMMON.Entry" }),
        };
        const confirm = await Dialogs.confirm (options);
        if (!confirm) {
          return;
        }
      }
      /** @type [] **/
      const array = ObjectUtils.getProperty(this.actor, path);
      if (array && (index !== undefined)) {
        array.splice(index, 1);
        await this.actor.update({
          [`${path}`]: array,
        });
      }
    }
  }

  /**
   * @typedef {'item', 'attribute-check', 'open-check'} AH_SheetAction
   */

  /**
   * @typedef AH_SheetActionData
   * @extends DOMStringMap
   * @property {AH_SheetAction} type
   */

  /**
   * @this AHActorSheet
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

      case "open-check": {
        await CheckPrompt.openCheck(this.actor);
      }
        break;

      case "attribute-check": {
        await CheckPrompt.attributeCheck(this.actor);
      }
        break;

      case "defense-check": {
        const { defense, difficulty } = target.dataset;
        await CheckPrompt.defenseCheck(this.actor, {
          initialConfig: {
            defense: defense,
            difficulty: difficulty,
          },
        });
      }
        break;

      case "item": {
        const item = await this.actor.items.get(id);
        await item.perform(modifiers);
      }
        break;
    }
  }

  /**
   * @this AHActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #sendItem(event, target) {
    event.preventDefault();
    const { id } = target.dataset;
    const modifiers = HTMLUtils.getKeyboardModifiers(event);
    const item = this.actor.items.get(id);
    if (item) {
      await item.sendToChat();
    }
  }

  /**
   * @this AHActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #editDocument(event, target) {
    event.preventDefault();
    const { id, type } = target.dataset;
    switch (type) {
      case "Item": {
        const item = this.actor.items.get(id);
        if (item) {
          await item.sheet.render({ force: true });
        }
        break;
      }
    }
  }

  /**
   * @this AHActorSheet
   * @param {PointerEvent} event   The originating click event
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action]
   * @returns {Promise<void>}
   */
  static async #deleteDocument(event, target) {
    event.preventDefault();
    const { id, type } = target.dataset;
    switch (type) {
      case "Item": {
        const item = this.actor.items.get(id);
        if (item) {
          await item.delete();
        }
        break;
      }
    }
  }

  /* -------------------------------------------------- */
  /*   Helper functions                                 */
  /* -------------------------------------------------- */

  /**
   * Fetches the embedded document representing the containing HTML element.
   *
   * @param {HTMLElement} target      The element subject to search.
   * @returns {Item|ActiveEffect}     The embedded Item or ActiveEffect.
   */
  _getEmbeddedDocument(target) {
    const docRow = target.closest("li[data-document-class]");
    if (docRow.dataset.documentClass === "Item") {
      return this.actor.items.get(docRow.dataset.itemId);
    } else if (docRow.dataset.documentClass === "ActiveEffect") {
      const parent = docRow.dataset.parentId === this.actor.id ?
        this.actor :
        this.actor.items.get(docRow?.dataset.parentId);
      return parent.effects.get(docRow.dataset.effectId);
    } else {
      console.warn("Could not find document class");
    }
  }

  /* -------------------------------------------------- */
  /*   Actor override handling                          */
  /* -------------------------------------------------- */

  /**
   * Submit a document update based on the processed form data.
   * @param {SubmitEvent} event                   The originating form submission event.
   * @param {HTMLFormElement} form                The form element that was submitted.
   * @param {object} submitData                   Processed and validated form data to be used for a document update.
   * @returns {Promise<void>}
   * @protected
   * @inheritdoc
   */
  async _processSubmitData(event, form, submitData) {
    const overrides = foundry.utils.flattenObject(this.actor.overrides);
    for (const k of Object.keys(overrides)) delete submitData[k];
    this.document.update(submitData);
  }

  /* -------------------------------------------------- */

  /**
   * Disables inputs subject to active effects.
   */
  #disableOverrides() {
    const flatOverrides = foundry.utils.flattenObject(this.actor.overrides);
    for (const override of Object.keys(flatOverrides)) {
      const input = this.element.querySelector(`[name="${override}"]`);
      if (input) input.disabled = true;
    }
  }
}
