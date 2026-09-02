import { renderTemplate, systemTemplatePath } from "../constants.mjs";
import { ObjectUtils, StringUtils } from "../utils/_module.mjs";

const { api, fields, handlebars } = foundry.applications;

/**
 * @typedef AH_DialogAction
 * @property {String} name
 * @property {String} action
 * @property {String} icon
 */

/**
 * @typedef FormSelectOption
 * @property {string} [value]
 * @property {string} [label]
 * @property {string} [group]
 * @property {boolean} [disabled]
 * @property {boolean} [selected]
 * @property {boolean} [rule]
 * @property {String} img (Custom for system dialogs).
 * @property {Record<string, string>} [dataset]
 */

/**
 * @callback DialogV2ButtonCallback
 * @param {PointerEvent|SubmitEvent} event        The button click event, or a form submission event if the dialog was
 *                                                submitted via keyboard.
 * @param {HTMLButtonElement} button              If the form was submitted via keyboard, this will be the default
 *                                                button, otherwise the button that was clicked.
 * @param {DialogV2} dialog                       The DialogV2 instance.
 * @returns {Promise<any>}
 */

/**
 * @typedef DialogV2Button
 * @property {string} action                      The button action identifier.
 * @property {string} label                       The button label. Will be localized.
 * @property {string} [icon]                      FontAwesome icon classes.
 * @property {string} [class]                     CSS classes to apply to the button.
 * @property {Record<string, string>} [style]     CSS style to apply to the button.
 * @property {string} [type="submit"]             The button type.
 * @property {boolean} [disabled]                 Whether the button is disabled.
 * @property {boolean} [default]                  Whether this button represents the default action to take if the user
 *                                                submits the form without pressing a button, i.e. with an Enter
 *                                                keypress.
 * @property {DialogV2ButtonCallback} [callback]  A function to invoke when the button is clicked. The value returned
 *                                                from this function will be used as the dialog's submitted value.
 *                                                Otherwise, the button's identifier is used.
 */

/**
 * @typedef SelectInputConfig
 * @property {FormSelectOption[]} options
 * @property {string[]} [groups]        An option to control the order and display of optgroup elements. The order of
 *                                      strings defines the displayed order of optgroup elements.
 *                                      A blank string may be used to define the position of ungrouped options.
 *                                      If not defined, the order of groups corresponds to the order of options.
 * @property {string} [blank]
 * @property {string} [valueAttr]       An alternative value key of the object passed to the options array.
 * @property {string} [labelAttr]       An alternative label key of the object passed to the options array.
 * @property {boolean} [localize=false] Localize value labels.
 * @property {boolean} [sort=false]     Sort options alphabetically by label within groups.
 * @property {"single"|"multi"|"checkboxes"} [type] Customize the type of select that is created.
 */

/**
 * @typedef AHDialogOptions
 * @property title
 * @property message
 */

const DIALOG_CLASSES = ["ah-application", "ah-dialog"];

export default class Dialogs {
  /**
   * @param {AHDialogOptions} options
   * @returns {Promise<*|boolean|boolean>}
   */
  static async confirm(options) {
    return foundry.applications.api.DialogV2.confirm({
      window: {
        title: options.title,
        icon: "fas fa-comment",
      },
      classes: DIALOG_CLASSES,
      content: await renderTemplate("dialogs/common", {
        message: options.message,
      }),
      rejectClose: false,
      yes: {
        label: "AH.COMMON.Confirm",
      },
      no: {
        label: "AH.COMMON.Cancel",
      },
    });
  }

  /**
   * @param {Object} options
   * @returns {Promise<*>}
   */
  static async input(options = {}) {
    const defaultOptions = {
      window: { title: options.title, icon: "fas fa-comment" },
      content: options.content,
      classes: DIALOG_CLASSES,
      rejectClose: false,
      ok: {
        label: "AH.COMMON.Confirm",
      },
      actions: {
        // Image Picker: Browse
        browseImage: (event, target) => {
          const { name } = target.dataset;
          const imagePicker = event.currentTarget.querySelector(".image-picker");
          if (!imagePicker) {
            return;
          }
          const preview = imagePicker.querySelector("img");
          const input = imagePicker.querySelector(`input[name="${name}"]`);
          // eslint-disable-next-line no-undef
          new FilePicker({
            type: "image",
            current: input?.value,
            callback: (path) => {
              if (input) {
                input.value = path;
                preview.src = path;
              }
            },
          }).render(true);
        },
        // Generic File
        browse: (event, target, dialog) => {
          const { name, type } = target.dataset;
          const input = event.currentTarget.querySelector(`input[name="${name}"]`);
          // eslint-disable-next-line no-undef
          new FilePicker({
            type: type,
            current: input?.value,
            callback: (path) => {
              if (input) input.value = path;
            },
          }).render(true);
        },
        toggleTag: (event, target) => {
          if (!options.context) {
            return;
          }
          const { path, tag } = target.dataset;
          const tags = ObjectUtils.getProperty(options.context, path);
          if (!tags) {
            return;
          }

          const index = tags.indexOf(tag);
          if (index === -1) {
            tags.push(tag);
            target.classList.add("active");
          } else {
            tags.splice(index, 1);
            target.classList.remove("active");
          }
        },
      },
    };
    ObjectUtils.mergeRecursive(defaultOptions, options);
    return await foundry.applications.api.DialogV2.input(defaultOptions);
  }

  /**
   * @param {String} title
   * @param {String} content
   * @param {Object} options
   * @returns {Promise}
   */
  static async popout(title, content, options = {}) {
    const defaultOptions = {
      window: { title, icon: "fas fa-eye", resizable: true },
      classes: DIALOG_CLASSES,
      rejectClose: false,
      content,
      buttons: [{ label: "Close", action: "close" }],
    };
    ObjectUtils.mergeRecursive(defaultOptions, options);
    await foundry.applications.api.DialogV2.wait(defaultOptions);
  }

  /**
   * @param {String} title
   * @param {FormSelectOption[]} options
   * @param {string} [selected] the default selected value
   * @returns {Promise<String|null>} The single selected option
   */
  static async select(title, options, selected) {
    const selectInput = fields.createSelectInput({
      options: options,
      name: "option",
      type: "checkboxes",
      value: selected,
    });

    const selectGroup = fields.createFormGroup({
      input: selectInput,
      label: "Option",
    });

    const content = `${selectGroup.outerHTML}`;

    const data = await api.DialogV2.input({
      window: { title: title, icon: "fas fa-comment" },
      classes: ["ah-application"],
      content: content,
    });
    return data?.option ?? null;
  }

  /**
   * @param {Object} options
   * @param {string} options.title
   * @param {string} options.content
   * @param {DialogV2Button[]} options.buttons
   * @returns {Promise<string|null>}
   */
  static async choice({ title, content, buttons }) {
    const result = await foundry.applications.api.DialogV2.wait({
      window: {
        title,
        icon: "fas fa-square-up-right",
      },
      position: {
        width: 500,
      },
      classes: DIALOG_CLASSES,
      content,
      buttons,
    });
    return result ?? null;
  }

  /**
   * @typedef ItemSelectionColumn
   * @property {String} label
   * @property {function(Item) : String} getContent
   */

  /**
   * @typedef {'grid'|'list'|'deck'|'grouped-list'} ItemSelectStyle
   */

  /**
   * @typedef ItemSelectionEntry
   * @property {String} name
   * @property {String} img
   */

  /**
   * @typedef ItemSelectionData
   * @property {String} title
   * @property {String} message
   * @property {ItemSelectionEntry[]} items
   * @property {Object[]} payload Associated data returned instead of the item reference.
   * @property {AHItem[]} compendiumItems If assigned, will be used to compare to the original items.
   * @property {Object[]} initial
   * @property {Boolean} quick If set, the selection will be confirmed on a single click.
   * @property {{name: string, items: Object[]}[]} groups
   * @property {ItemSelectionColumn[]} columns Additional columns for the dialog.
   * @property {ItemSelectStyle} style
   * @property {Number} max
   * @property {(item: AHItem) => Promise<string>} getDescription
   * @property {String} okLabel
   * @property {Boolean} throw If no selection was made, whether to throw an error.
   */

  /**
   * @param {ItemSelectionData} data
   * @returns {Promise<Object[]>}
   */
  static async itemSelect(data) {
    data.style = data.style ?? "grid";
    data.title = data.title ?? StringUtils.localize("AH.COMMON.Selection");

    let selectedItems = [];
    let selectedIndexes = [];
    if (data.initial) {
      selectedItems.push(...data.initial);
      selectedIndexes.push(...data.initial.map((initial) => (initial._originalIndex !== undefined ? initial._originalIndex : data.items.findIndex((item) => item.id === initial.id))));
    }

    // We cache the item descriptions here...
    const descriptions = await Promise.all(data.items.map((item) => data.getDescription(item)));
    // Additional columns
    let columnData = {};
    if (data.columns) {
      for (const column of data.columns) {
        columnData[column.label] = await Promise.all(data.items.map((item) => column.getContent(item)));
      }
    }
    const context = {
      ...data,
      descriptions,
      columnData,
    };

    /**
     * @param {HTMLElement} container
     * @param {HTMLElement} card
     * @param {Boolean} updateData
     */
    const toggleCardSelection = (container, card, updateData = true) => {
      const index = Number.parseInt(card.dataset.index);
      const cardItem = data.items[index];

      if (!card.classList.contains("selected")) {
        const selectedCards = container.querySelectorAll(".ah-dialog-item.selected");
        if (selectedCards.length >= data.max) return;
        card.classList.add("selected");
        if (updateData) {
          selectedItems.push(cardItem);
          selectedIndexes.push(index);
        }
      } else {
        card.classList.remove("selected");
        if (updateData) {
          selectedItems = selectedItems.filter((it) => it !== cardItem);
          selectedIndexes = selectedIndexes.filter((it) => it !== index);
        }
      }
    };

    const result = await foundry.applications.api.DialogV2.input({
      window: {
        title: data.title,
      },
      position: {
        width: 600,
      },
      actions: {
        /** @param {Event} event
         *  @param {HTMLElement} dialog **/
        selectAll: (event, dialog) => {
          const inputs = dialog.closest("#items").querySelectorAll("input[name=\"selected\"]");
          const _selectedIndexes = [];
          for (const input of inputs) {
            input.checked = true;
            const card = input.closest(".ah-dialog-item");
            if (card) {
              card.classList.toggle("selected", true);
              const index = Number.parseInt(card.dataset.index);
              if (Number.isFinite(index)) _selectedIndexes.push(index);
            }
          }
          selectedItems = data.items;
          selectedIndexes = _selectedIndexes;
          return false;
        },
        /** @param {Event} event
         *  @param {HTMLElement} dialog **/
        deselectAll: (event, dialog) => {
          const inputs = dialog.closest("#items").querySelectorAll("input[name=\"selected\"]:checked");
          for (const input of inputs) {
            input.checked = false;
            const card = input.closest(".ah-dialog-item");
            if (card) {
              card.classList.toggle("selected", false);
            }
          }
          selectedItems = [];
          selectedIndexes = [];
          return false;
        },
      },
      classes: data.quick ? DIALOG_CLASSES.concat("--quick") : DIALOG_CLASSES,
      content: await renderTemplate("dialogs/dialog-item-select", context),
      rejectClose: false,
      ok: {
        icon: "fas fa-check",
        label: data.okLabel ?? "AH.COMMON.Confirm",
      },
      /** @param {Event} event
       *  @param {HTMLElement} dialog **/
      render: async (event, dialog) => {
        const document = dialog.element;
        const container = document.querySelector("#items");
        const searchInput = document.querySelector("[data-role=\"selection-filter\"]");

        const applySearchFilter = () => {
          if (!container || !searchInput) return;
          const query = searchInput.value.trim().toLocaleLowerCase();

          for (const entry of container.querySelectorAll(".ah-dialog-item[data-index]")) {
            const target = entry.closest("tr") ?? entry;
            const name = (entry.dataset.name || entry.textContent || "").toLocaleLowerCase();
            target.style.display = !query || name.includes(query) ? "" : "none";
          }

          if (data.style !== "grouped-list") return;
          for (const header of container.querySelectorAll(".group-header")) {
            let row = header.nextElementSibling;
            let hasVisibleRows = false;
            while (row && !row.classList.contains("group-header")) {
              if (row.style.display !== "none") {
                hasVisibleRows = true;
                break;
              }
              row = row.nextElementSibling;
            }
            header.style.display = hasVisibleRows ? "" : "none";
          }
        };

        searchInput?.addEventListener("input", applySearchFilter);

        // Handle opening journal entries when clicking the icon
        document.addEventListener(
          "click",
          (clickEvent) => {
            const wrapper = clickEvent.target.closest(".journal-page-icon-wrapper[data-journal-uuid][data-page-uuid]");
            if (wrapper) {
              const journalUuid = wrapper.dataset.journalUuid;
              const pageUuid = wrapper.dataset.pageUuid;
              if (journalUuid && pageUuid) {
                clickEvent.preventDefault();
                clickEvent.stopPropagation();
                const journal = fromUuidSync(journalUuid);
                const page = fromUuidSync(pageUuid);

                if (journal && page) {
                  const jSheet = journal.sheet;
                  const goToPage = () => {
                    if (typeof jSheet.goToPage === "function") return jSheet.goToPage(page.id);
                    if (typeof jSheet.navigatePage === "function") return jSheet.navigatePage(page.id);
                  };

                  if (jSheet.rendered) {
                    goToPage();
                    return;
                  }

                  Hooks.once("renderJournalSheet", (sheet) => {
                    if (sheet === jSheet) goToPage();
                  });
                  jSheet.render(true, { pageId: page.id });
                }
              }
            }
          },
          true,
        );

        // Initial Selection
        const inputs = container.querySelectorAll("input[name=\"selected\"]:checked");
        for (const input of inputs) {
          const card = input.closest(".ah-dialog-item");
          if (card) {
            toggleCardSelection(container, card, false);
          }
        }

        if ((data.style !== "list") && (data.style !== "grouped-list")) {
          container.addEventListener("mousedown", async (event) => {
            const card = event.target.closest(".ah-dialog-item");
            if (!card) return;
            toggleCardSelection(container, card);

            if (data.quick) {
              const submitButton = document.querySelector("button[type=submit]");
              return dialog._onSubmit(submitButton, event);
            }
          });
        } else {
          container.addEventListener("change", (event) => {
            const input = event.target;

            // Handle group checkbox
            if (input?.name === "group-selected") {
              const groupIndex = Number.parseInt(input.dataset.groupIndex);
              if (Number.isFinite(groupIndex) && data.groups && data.groups[groupIndex]) {
                const groupRow = input.closest(".group-header");
                if (groupRow) {
                  const nextRow = groupRow.nextElementSibling;
                  let currentRow = nextRow;
                  // Toggle all pages in this group
                  while (currentRow && !currentRow.classList.contains("group-header")) {
                    const pageCheckbox = currentRow.querySelector("input[name=\"selected\"]");
                    if (pageCheckbox) {
                      pageCheckbox.checked = input.checked;
                      pageCheckbox.dispatchEvent(new Event("change", { bubbles: true }));
                    }
                    currentRow = currentRow.nextElementSibling;
                  }
                }
              }
              return;
            }

            // Handle individual page checkbox
            if (input?.name !== "selected") return;
            const card = input.closest(".ah-dialog-item");
            if (!card) return;
            const index = Number.parseInt(card.dataset.index);
            if (!Number.isFinite(index)) return;
            const listItem = data.items[index];
            if (input.checked) {
              if (!selectedIndexes.includes(index)) {
                selectedItems.push(listItem);
                selectedIndexes.push(index);
              }
            } else {
              selectedItems = selectedItems.filter((it) => it !== listItem);
              selectedIndexes = selectedIndexes.filter((it) => it !== index);
            }
          });
        }

        applySearchFilter();
      },
    });
    if (result) {
      // If a custom payload is expected
      if (data.payload) {
        return selectedIndexes.map((idx) => data.payload[idx]);
      } else {
        return selectedItems;
      }
    } else {
      if (data.throw) {
        throw Error(StringUtils.localize("AH.COMMON.CanceledByUser"));
      }
      return [];
    }

  }

}
