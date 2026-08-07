/**
 * @typedef ActionPotencyComponent
 * @property {String} text
 * @property {ChatAction[]} actions Actions to be executed on this potency.
 */

/**
 * @typedef ActionPotency
 * @property {ActionPotencyComponent[]} components
 */

/**
 * @typedef ActionPotencyTable
 * @property {ActionPotency} reduced
 * @property {ActionPotency} standard
 * @property {ActionPotency} powerful
 */
