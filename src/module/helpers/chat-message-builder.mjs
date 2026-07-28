import { renderTemplate, systemTemplatePath } from "../constants.mjs";
import { FoundryUtils } from "../utils/_module.mjs";
import { ChatMessageSections, ChatSectionOrder } from "./chat-message-sections.mjs";
import { FlagBuilder } from "./_module.mjs";

/**
 * @typedef ChatMessageBuilderData
 * @property {ChatMessageSection} sections
 * @property {Promise[]} postRenderActions
 * @property {Tag[]} tags
 * @property {Object} flags
 */

/**
 * @desc Builder of actionable chat messages for the system.
 */
export default class ChatMessageBuilder {
  /**
   * @type {ChatMessageBuilderData}
   */
  #renderData;
  /**
   * @type {Object[]}
   */
  #flags;
  /**
   * @type {AHActor}
   */
  #actor;
  /**
   * @type {AHItem}
   */
  #item;
  /**
   * @type {(Roll|Object)[]}
   */
  #rolls;
  /**
   * @type {String} Custom flavor text.
   */
  #flavor;

  constructor(actor, item) {
    this.#actor = actor;
    this.#item = item;
    this.#flags = [];
    this.#renderData = {
      tags: [],
      sections: [],
      postRenderActions: [],
      flags: [],
    };
  }

  /**
   * @returns {AHActor}
   */
  get actor() {
    return this.#actor;
  }

  /**
   * @returns {AHItem}
   */
  get item() {
    return this.#item;
  }

  /**
   * @returns {ChatMessageSectionCollection}
   */
  get sections() {
    return this.#renderData.sections;
  }

  /**
   * @returns {ChatMessageBuilderData}
   */
  get renderData() {
    return this.#renderData;
  }

  /**
   * @returns {Object}
   */
  getMergedFlags() {
    // Merge all current flags
    let merged = {};
    for (const current of this.#flags) {
      foundry.utils.mergeObject(merged, current, { overwrite: false });
    }
    foundry.utils.mergeObject(merged, this.#renderData.flags, { overwrite: false });
    return merged;
  }

  /**
   * @param {Record|FlagBuilder} flags Adds a flags object to the chat message. It will be merged with others.
   * @returns {ChatMessageBuilder}
   */
  withFlags(flags) {
    if (flags) {
      if (flags instanceof FlagBuilder) {
        flags = flags.toObject();
      }
      this.#flags.push(flags);
    }
    return this;
  }

  withRolls(rolls) {
    this.#rolls = rolls;
    return this;
  }

  /**
   * @param {ChatMessageBuilderData} data
   * @returns {ChatMessageBuilder}
   */
  withData(data) {
    this.#renderData = data;
    if (!this.#renderData.tags) {
      this.#renderData.tags = [];
    }
    if (!this.#renderData.postRenderActions) {
      this.#renderData.postRenderActions = [];
    }
    this.withFlags(data.flags);
    return this;
  }

  withFlavor(flavor) {
    this.#flavor = flavor;
    return this;
  }

  /**
   * @desc Renders the chat message.
   * @returns {Promise<void>}
   */
  async create() {
    const actor = this.#actor;
    const item = this.#item;

    /**
     * @type {ChatMessageSection[]}
     */
    const allSections = [];
    for (let value of this.sections) {
      value = await (value instanceof Function ? value() : value);
      if (value) {
        allSections.push(value);
      }
    }

    // Tag Support: We need to run the functions above first which could end up adding tags
    if (this.#renderData.tags.length > 0) {
      let secondPassSections = [];
      ChatMessageSections.tags(secondPassSections, this.#renderData.tags, ChatSectionOrder.tags);
      for (let value of secondPassSections) {
        value = await (value instanceof Function ? value() : value);
        if (value) {
          allSections.push(value);
        }
      }
    }

    const partitionedSections = allSections.reduce(
      (agg, curr) => {
        if (Number.isNaN(curr.order)) {
          agg.flavor.push(curr);
        } else {
          agg.body.push(curr);
        }
        return agg;
      },
      { flavor: [], body: [] },
    );

    // Get the merged flags now
    const flags = this.getMergedFlags();

    /**
     * @type {ChatMessageSection[]}
     */
    const flavorSections = partitionedSections.flavor;
    /**
     * @type {ChatMessageSection[]}
     */
    const bodySections = partitionedSections.body;
    bodySections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Gather flavor text
    let flavor;
    if (flavorSections.length) {
      flavor = "";
      for (let flavorSection of flavorSections) {
        if (flavorSection.content) {
          flavor = flavor + flavorSection.content;
        } else {
          flavor = flavor + (await renderTemplate(flavorSection.partial, flavorSection.data));
        }
      }
    }
    // If no flavor text was provided...
    if (!flavor?.trim()) {
      if (this.#flavor) {
        flavor = this.#flavor;
      } else {
        flavor = item
          ? await renderTemplate("chat/chat-section-flavor-item", {
            item: item,
          })
          : "";
      }
    }

    // Resolve speaker
    let speaker = FoundryUtils.resolveSpeaker(actor);

    // Prepare data
    const chatMessage = {
      flavor: flavor,
      content: await renderTemplate("chat/chat-sections", { sections: bodySections }),
      speaker: speaker,
      flags: flags,
    };
    const options = {};

    // OPTION: Roll data
    if (this.#rolls) {
      chatMessage.rolls = this.#rolls;
      options.rollMode = "roll";
    }

    // Render to chat
    await ChatMessage.create(chatMessage, options);

    // Execute post-render actions
    for (const promise of this.#renderData.postRenderActions) {
      await promise();
    }
  }
}
