import { enrichHTML, getSystemSetting, renderTemplate, systemAssetPath } from "../../constants.mjs";
import { FileUtils, FoundryUtils, HTMLUtils, ObjectUtils, StringUtils } from "../../utils/_module.mjs";
import { CodexDataModel, CodexEntryDataModel } from "../../data/ui/_module.mjs";
import AH from "../../config.mjs";
import { Dialogs } from "../../helpers/_module.mjs";
import enrichers from "../../pipelines/enrichers.mjs";

export default class CodexBrowser {
  /** @type AHPartySheet **/
  sheet;
  /** @type AHActor **/
  actor;
  /** @type PartyData **/
  party;

  /** @type RegExp **/
  #linkPattern;
  /** @type String[] **/
  selected;
  /** @type String **/
  filter;
  /** @type String[] **/
  enrichedDescriptions;

  static PROXY_ACTOR_NAME = "AH: Codex Entry Placeholder";
  static PROXY_ACTOR_IMG = systemAssetPath("ui/ah-logo.png");
  static UPLOAD_FILE_PREFIX = "codex-entry";

  constructor(sheet) {
    this.sheet = sheet;
    this.selected = [];
    this.enrichedDescriptions = [];
    this.refresh(sheet.actor);
  }

  /**
   * @param {HTMLElement} html
   */
  attachListeners(html) {
    // TOOLBAR
    const toolbar = html.querySelector(".ah-toolbar");
    const searchInput = toolbar.querySelector(".ah-toolbar__search").querySelector("input");
    if (searchInput) {
      requestAnimationFrame(() => searchInput.removeAttribute("disabled"));
      searchInput.addEventListener(
        "input",
        HTMLUtils.debounce(() => {
          const text = searchInput.value.toLowerCase() || "";
          this.filter = text;
          this.updateEntries();
        }, 150),
      );
    }
    html.querySelectorAll(".ah-tag__group .ah-tag__filter").forEach((tag) => {
      tag.addEventListener("click", () => {
        const value = tag.dataset.tag;

        if (this.selected.includes(value)) {
          this.selected = this.selected.filter((t) => t !== value);
          tag.classList.remove("active");
        } else {
          this.selected.push(value);
          tag.classList.add("active");
        }

        this.updateEntries();
      });
    });
    // ENTRIES
    FoundryUtils.contextMenu(
      html,
      "[data-context-menu=\"shareCodexEntry\"]",
      [
        {
          name: StringUtils.localize("SIDEBAR.CharArt"),
          icon: "<i class=\"ah-icon--xs fas fa-image\"></i>",
          callback: async (el) => {
            const { index } = el.dataset;
            return this.executeCodexEntryAction(Number.parseInt(index), "display");
          },
        },
        {
          name: StringUtils.localize("AH.DIALOG.ChatMessageSend"),
          icon: "<i class=\"ah-icon--xs fas fa-comment\"></i>",
          callback: async (el) => {
            const { index } = el.dataset;
            return this.executeCodexEntryAction(Number.parseInt(index), "send");
          },
        },
        {
          name: StringUtils.localize("AH.DIALOG.InstantiateToken"),
          icon: "<i class=\"ah-icon--xs fas fa-user\"></i>",
          callback: async (el) => {
            const { index } = el.dataset;
            return this.executeCodexEntryAction(Number.parseInt(index), "token");
          },
        },
        {
          name: StringUtils.localize("CONTROLS.TilePlace"),
          icon: "<i class=\"ah-icon--xs fa-solid fa-cube\"></i>",
          callback: async (el) => {
            const { index } = el.dataset;
            return this.executeCodexEntryAction(Number.parseInt(index), "tile");
          },
        },
      ],
      "click",
    );
  }

  /**
   * @param context
   * @returns {Promise<void>}
   */
  async prepareContext(context) {
    this.refresh(this.sheet.actor);
    context.browser = this;
    context.playingSounds = new Set(
      game.playlists.contents
        .flatMap((p) => p.sounds.contents)
        .filter((s) => s.playing)
        .map((s) => s.name),
    );
  }

  /**
   * @param {AHActor} actor
   * @param {HTMLElement} element
   */
  refresh(actor, element) {
    this.actor = actor;
    this.party = actor.system;
    this.#linkPattern = undefined;
    if (element) {
      this.sortEntries(element);
    }
  }

  /**
   * @param {HTMLElement} element
   */
  sortEntries(element) {
    const entries = element.querySelector(".tab.codex .entries");
    if (entries) {
      const items = [...entries.querySelectorAll("li.entry")];
      items
        .sort((a, b) => {
          const indexA = Number(a.dataset.index);
          const indexB = Number(b.dataset.index);
          const entryA = this.party.codex.entries[indexA];
          const entryB = this.party.codex.entries[indexB];
          if (!entryA || !entryB) return 0;
          return entryA.name.localeCompare(entryB.name);
        })
        .forEach((li) => entries.appendChild(li));
    }
  }

  async resetTags() {
    const defaultCodexTags = CodexDataModel.getDefaultTags();
    const currentTags = ObjectUtils.safeClone(this.party.codex.tags);
    for (const tag of defaultCodexTags) {
      if (!currentTags.includes(tag)) {
        currentTags.push(tag);
      }
    }

    await this.actor.update({ ["system.codex.tags"]: currentTags });
  }

  async enrichDescriptions() {
    this.enrichedDescriptions.splice(0, this.enrichedDescriptions.length);
    for (const entry of this.party.codex.entries) {
      const ed = await this.#enrichEntryDescription(entry);
      this.enrichedDescriptions.push(ed);
    }
  }

  updateEntries() {
    const element = this.sheet.element;
    const entries = element.querySelector(".tab.codex .entries");
    if (entries) {
      const set = new Set(this.selected);
      const filter = this.filter ? this.filter.toLowerCase() : "";

      for (const li of entries.querySelectorAll("li.entry")) {
        const index = li.dataset.index;
        const entry = this.party.codex.entries[index];
        if (!entry) {
          return;
        }

        let visible = true;
        if (entry.hidden && !game.user.isGM) {
          visible = false;
        } else if (!entry.name.toLowerCase().includes(filter)) {
          visible = false;
        } else if ((set.size > 0) && ![...set].every((tag) => entry.tags.includes(tag))) {
          visible = false;
        }

        li.classList.toggle("hidden", !visible);
      }
    }
  }

  /**
   * @param {CodexEntryDataModel} entry
   * @returns {Promise<String>}
   */
  async #enrichEntryDescription(entry) {
    if (!entry.description) {
      return "";
    }
    const autoLinked = entry.description.replace(this.getCodexLinkPattern(), (match) => {
      if (match.toLowerCase() === entry.name.toLowerCase()) return match;
      return `@CODEX[${match}]`;
    });
    return await enrichHTML(autoLinked, {});
  }

  /**
   * @param {PointerEvent} event   The originating click event.
   * @param {HTMLElement} target   The capturing HTML element which defined a [data-action].
   * @returns {Promise<void>}
   */
  async handleContextAction(event, target) {
    const { type, index } = target.dataset;
    return this.executeCodexEntryAction(index, type);
  }

  /**
   * @param {Number} index
   * @param {String} type
   * @returns {Promise<void>}
   */
  async executeCodexEntryAction(index, type) {
    /** @type CodexEntryDataModel[] **/
    const entries = this.party.codex.entries;
    /** @type CodexEntryDataModel **/
    let entry = entries[index];
    if (!entry) {
      return;
    }
    switch (type) {
      case "view":
        {
          await this.viewCodexEntry(entry);
        }
        break;

      case "edit":
        {
          if (entry.toObject) {
            entry = entry.toObject();
          }
          entry = foundry.utils.deepClone(entry);
          const ok = await this.editCodexEntry(entry);
          if (ok) {
            entries[index] = entry;
            await this.actor.update({ ["system.codex.entries"]: entries });
          }
        }
        break;

      case "send":
        {
          const enrichedDescription = await this.#enrichEntryDescription(entry);
          await this.#enrichEntryDescription(entry);
          const chatMessage = {
            content: await renderTemplate("chat/chat-codex-entry", {
              entry: entry,
              enrichedDescription,
            }),
          };
          await ChatMessage.create(chatMessage);
        }
        break;

      case "display":
        FoundryUtils.popoutImage(entry.img, entry.name);
        break;

      case "playSound":
        await entry.playSound();
        this.sheet.render(true);
        break;

      case "stopSound":
        await entry.stopSound();
        this.sheet.render(true);
        break;

      case "tile":
        {
          if (entry.img === CodexEntryDataModel.DEFAULT_IMAGE_PATH) {
            ui.notifications.warn("The codex entry is still using the default image.");
            return;
          }
          const tile = await FoundryUtils.placeTile(entry.img);
          if (tile) {
            await canvas.tiles.activate();
            tile.object.control({ releaseOthers: true });
          }
        }
        break;

      case "token":
        {
          if (entry.img === CodexEntryDataModel.DEFAULT_IMAGE_PATH) {
            ui.notifications.warn("The codex entry is still using the default image.");
            return;
          }
          let actor = game.actors.getName(CodexBrowser.PROXY_ACTOR_NAME);
          if (!actor) {
            // eslint-disable-next-line no-undef
            actor = await Actor.implementation.create({
              name: CodexBrowser.PROXY_ACTOR_NAME,
              img: CodexBrowser.PROXY_ACTOR_IMG,
              type: "entity",
            });
          }
          const token = await FoundryUtils.instantiateActor(
            actor,
            {
              name: entry.name,
              texture: {
                src: entry.img,
              },
            },
            true,
          );
          if (token) {
            ui.notifications.info(`Instanced a token for ${entry.name} on the active scene.`);
            canvas.tokens.activate();
            token.object.control({ releaseOthers: true });
          }
        }
        break;
    }
  }

  /**
   * @param {String} name
   * @returns {Promise<void>}
   */
  async revealCodexEntry(name) {
    const entry = this.party.codex.resolveEntry(name);
    if (entry) {
      await this.viewCodexEntry(entry);
    }
  }

  /**
   * @param {CodexEntryDataModel} entry
   * @returns {Promise<boolean>}
   */
  async viewCodexEntry(entry) {
    const enrichedDescription = await this.#enrichEntryDescription(entry);

    const [width, height] = await HTMLUtils.resolveImageDimensions(entry.img);
    let layout = HTMLUtils.getViewerLayout(width, height, enrichedDescription.length);
    const layoutClass = layout ? `--${layout}` : null;

    const content = await renderTemplate("dialogs/codex-entry-view", {
      entry: entry,
      enrichedDescription,
      layoutClass,
    });

    await Dialogs.popout(entry.name, content, {
      position: {},
      classes: ["ah-codex__entry__frame"],
    });
  }

  /**
   * @returns {Promise<void>}
   */
  async addCodexEntry() {
    /** @type CodexEntryDataModel[] **/
    const entries = this.party.codex.entries;
    /** @type CodexEntryDataModel **/
    let entry = {
      img: CodexEntryDataModel.DEFAULT_IMAGE_PATH,
      tags: [],
    };
    const ok = await this.editCodexEntry(entry);
    if (ok) {
      entries.push(entry);
      await this.actor.update({ ["system.codex.entries"]: entries });
    }
  }

  /**
   * @param {AHActor} actor
   * @returns {Promise<void>}
   */
  async importActor(actor) {
    if (this.party.codex.resolveEntry(actor.name)) {
      ui.notifications.warn(`Failed to import actor ${actor.name} as there's already an entry with that name.`);
      return;
    }

    const description = typeof actor?.system?.description === "string" ? actor.system.description : (actor?.system?.description?.value ?? actor?.system?.description?.content ?? "");

    /** @type CodexEntryDataModel **/
    let entry = {
      name: actor.name,
      img: actor.img,
      description,
      tags: ["character"],
    };

    const entries = ObjectUtils.safeClone(this.actor.system.codex.entries ?? []);
    entries.push(entry);
    await this.actor.update({ ["system.codex.entries"]: entries });
  }

  /**
   * @param {JournalEntryPageData} page
   * @returns {Promise<void>}
   */
  async importJournalEntryPage(page) {
    const journalName = page.parent?.name;
    let entryName = journalName ? `${page.name} (${journalName})` : page.name;

    if (this.party.codex.resolveEntry(entryName)) {
      ui.notifications.warn(`Failed to import journal entry page "${page.name}" from "${journalName}" as there's already an entry with that name.`);
      return;
    }

    /** @type CodexEntryDataModel **/
    let entry = {
      name: entryName,
      tags: [],
    };

    switch (page.type) {
      case "image":
        if (page.src) {
          entry.img = page.src;
        }
        break;

      case "text":
        if (page.text?.content) {
          entry.description = page.text.content;
        }
        break;
    }

    const entries = ObjectUtils.safeClone(this.actor.system.codex.entries ?? []);
    entries.push(entry);
    await this.actor.update({ ["system.codex.entries"]: entries });
  }

  /**
   * @param {CodexEntryDataModel} entry
   * @returns {Promise<boolean>}
   */
  async editCodexEntry(entry) {
    const context = {
      entry,
      tags: this.party.codex.tags,
      audioChannels: Object.entries(CONST.AUDIO_CHANNELS).reduce((channels, [key, value]) => {
        channels[key] = game.i18n.localize(value);
        return channels;
      }, {}),
    };
    const content = await renderTemplate("dialogs/codex-entry-edit", context);

    const result = await Dialogs.input({
      window: { title: `Edit — ${entry.name}` },
      position: {
        width: 750,
      },
      actions: {
        // Image Picker: Clipboard
        clipboardImage: async (event, target) => {
          const { name } = target.dataset;
          const imagePicker = event.currentTarget.querySelector(".image-picker");
          if (!imagePicker) {
            return;
          }
          const preview = imagePicker.querySelector("img");
          const input = imagePicker.querySelector(`input[name="${name}"]`);

          // Check if there's a valid upload directory
          const uploadDirectory = getSystemSetting("codexUploadDirectory");
          if (!uploadDirectory) {
            ui.notifications.warn(StringUtils.localize("AH.CODEX.UploadDirectoryMissing"));
            return;
          }

          const imagePath = await FileUtils.uploadClipboardImage(uploadDirectory, CodexBrowser.UPLOAD_FILE_PREFIX);
          if (!imagePath) {
            return;
          }

          // Update the preview and input
          preview.src = imagePath;
          input.value = imagePath;
        },
      },
      content,
      context,
      ok: {
        label: "Save",
        callback: (event, button, dialog) => ({
          name: dialog.element.querySelector("[name=\"name\"]").value.trim(),
          img: dialog.element.querySelector("[name=\"img\"]").value.trim(),
          description: dialog.element.querySelector("[name=\"description\"]").value.trim(),
          notes: dialog.element.querySelector("[name=\"notes\"]").value.trim(),
          hidden: dialog.element.querySelector("[name=\"hidden\"]").checked,

          audio: {
            path: dialog.element.querySelector("[name=\"audio.path\"]").value.trim(),
            volume: parseFloat(dialog.element.querySelector("[name=\"audio.volume\"]").value),
            channel: dialog.element.querySelector("[name=\"audio.channel\"]").value.trim(),
            repeat: dialog.element.querySelector("[name=\"audio.repeat\"]").checked,
          },
        }),
      },
    });

    if (!result) return false;
    if (!result.name) return false;

    entry.name = result.name;
    entry.img = result.img;
    entry.description = result.description;
    entry.hidden = result.hidden;
    entry.notes = result.notes;

    entry.audio = result.audio;

    return true;
  }

  /**
   * @returns {RegExp}
   */
  getCodexLinkPattern() {
    if (!this.#linkPattern) {
      const names = this.party.codex.entries
        .map((e) => e.name)
        .filter(Boolean)
        .sort((a, b) => b.length - a.length)
        .map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

      this.#linkPattern = new RegExp(`\\b(${names.join("|")})\\b`, "gi");
    }
    return this.#linkPattern;
  }
}
