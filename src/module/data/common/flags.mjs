/**
 * @typedef Flag
 * @property {String} key
 * @property {Object} value
 * @remarks Flag data can be of any type, as long as it can be JSON.stringify'd. Flags can be used with almost all types of documents — not just Actors and Items, but nearly everything in Foundry. Settings are the only exception.
 */

const Flags = Object.freeze({
  ChatMessage: Object.freeze({
    Check: "Check",
    Source: "Source",
  }),
});

export default Flags;
