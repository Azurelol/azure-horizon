/**
 * @typedef EpisodeOpeningData
 */

/**
 * @param {PartyDataModel} party
 * @returns {Promise<EpisodeOpeningData>}
 */
async function prepareOpeningData(party) {

}

/**
 * @typedef ExperienceTriggerGroup
 * @property {String} text
 * @property {Number} points
 */

/**
 * @typedef EpisodeEndingData
 * @property {ExperienceTriggerGroup} base
 * @property {ExperienceTriggerGroup[]} characters
 */

/**
 * @param {PartyDataModel} party
 * @returns {Promise<EpisodeEndingData>}
 */
async function prepareEndingData(party) {
  const heroes = await party.getHeroes();
  /** @type EpisodeEndingData **/
  let data = {};
  for (const hero of heroes) {
  }
  return data;
}

const Campaign = Object.freeze({
  prepareOpeningData,
  prepareEndingData,
});

export default Campaign;
