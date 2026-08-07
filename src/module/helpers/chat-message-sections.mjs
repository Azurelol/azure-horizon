import { enrichHTML, renderTemplate, systemTemplatePath } from "../constants.mjs";

/**
 * @desc Used for ordering the standardized chat message sections.
 * @type {Readonly<{tags: number}>}
 */
export const ChatSectionOrder = Object.freeze({
  flavor: Number.NaN,
  tags: -3000,
  tracker: -2500,
  details: -2000,
  reroll: -1100,
  roll: -1000,
  push: -1200,
  addendum: -900,
  result: 1000,
  actions: 2000,
  expenses: 2500,
});

/**
 * @typedef ChatMessageSection
 * @property {string} [content] the HTML markup to insert into the message, takes precedence over 'partial'
 * @property {string} [partial] the partial to render
 * @property {Object} [data] data to be passed to the partial
 * @property {number} [order] sections will be rendered in order, from lowest to highest
 */

/**
 * @typedef {(ChatMessageSection | Promise<ChatMessageSection> | (() => ChatMessageSection) | (() => Promise<ChatMessageSection>))[]} ChatMessageSectionCollection
 */

/**
 * @typedef Tag
 * @property {string} [tag] gets localized
 * @property {any} [value] doesn't get localized
 * @property {string} [tooltip] tooltip to attach to the tag, gets localized
 * @property {boolean} [flip] switches the position of tag and value
 * @property {string} [separator] placed between tag and
 * @property {any} [show] can be omitted, if defined and falsy doesn't render tag
 */

export const ChatMessageSectionTemplate = Object.freeze({
  tags: systemTemplatePath("chat/chat-section-tags"),
  flavor: systemTemplatePath("chat/chat-section-flavor"),
  flavorItem: systemTemplatePath("chat/chat-section-flavor-item"),
  check: systemTemplatePath("chat/chat-section-check"),
  damage: systemTemplatePath("chat/chat-section-apply-damage"),
  resource: systemTemplatePath("chat/chat-section-update-resource"),
  text: systemTemplatePath("chat/chat-section-text"),
  actions: systemTemplatePath("chat/chat-section-actions"),
  potencies: systemTemplatePath("chat/chat-section-potencies"),
});

/**
 * @desc Contains functions for chat message sections
 */
export const ChatMessageSections = Object.freeze({

  /**
   * @param {ChatMessageSectionCollection} sections
   * @param {Tag[]} tags
   * @param {number} [order]
   */
  tags: (sections, tags = [], order = ChatSectionOrder.details) => {
    tags = tags.filter((tag) => !("show" in tag) || tag.show);
    if (tags.length > 0) {
      sections.push(async () => ({
        partial: ChatMessageSectionTemplate.tags,
        data: {
          tags: tags,
        },
        order: order,
      }));
    }
  },

  /**
   * @param {ChatMessageSectionCollection} sections
   * @param {string} template
   * @param {Object} context
   * @param {number} [order]
   */
  template: (sections, template, context, order) => {
    sections.push(async () => {
      const content = await renderTemplate(template, context);
      return {
        content: content,
        order,
      };
    });
  },

  /**
   * @param {ChatMessageSectionCollection} sections
   * @param {string} content
   * @param {number} [order]
   */
  content: (sections, content, order) => {
    sections.push(async () => ({
      content: content,
      order,
    }));
  },

  /**
   * @param {ChatMessageSectionCollection} sections
   * @param {string, Promise<string>} text
   * @param {number} [order]
   */
  text: (sections, text, order) => {
    sections.push(async () => ({
      partial: ChatMessageSectionTemplate.text,
      data: {
        text: await enrichHTML(await text),
      },
      order,
    }));
  },

  /**
   * @param {ChatMessageSectionCollection} sections
   * @param {ChatAction[]} actions
   * @param {number} [order]
   */
  actions: (sections, actions, order = ChatSectionOrder.actions) => {
    sections.push(async () => ({
      partial: ChatMessageSectionTemplate.actions,
      data: {
        actions,
      },
      order,
    }));
  },

  /**
   * @param {ChatMessageSectionCollection} sections
   * @param {ActionPotencyTable} potencies
   * @param {number} [order]
   */
  potencies: (sections, potencies, order = ChatSectionOrder.actions) => {
    sections.push(async () => ({
      partial: ChatMessageSectionTemplate.potencies,
      data: {
        potencies,
      },
      order,
    }));
  },

});
