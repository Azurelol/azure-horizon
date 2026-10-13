/**
 * @typedef ActionOutcomeComponent
 * @property {String} text
 * @property {ChatAction[]} actions Actions to be executed on this potency.
 */

/**
 * @typedef ActionOutcome
 * @property {ActionOutcomeComponent[]} components
 */

/**
 * @typedef ActionOutcomeTable
 * @property {ActionOutcome} partial
 * @property {ActionOutcome} success
 * @property {ActionOutcome} critical
 */

/**
 * @typedef ActionOutcomeOptions
 * @property {AH_Outcome} outcome
 * @property {Boolean} selected
 * @property {Boolean} label
 */
