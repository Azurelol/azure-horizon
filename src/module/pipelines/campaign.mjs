/**
 * @typedef EpisodeOpeningData
 */

/**
 * @param {PartyDataModel} party
 * @returns {Promise<EpisodeOpeningData>}
 */
async function prepareOpeningData(party) {

}

const BASE_TRIGGERS = [

];

/**
 * @typedef ExperienceTriggerGroup
 * @property {String} text
 * @property {Number} points
 */

/**
 * @typedef EpisodeEndingData
 * @property {Record<string, ExperienceTriggerGroup>} groups
 */

/**
 * @param {PartyDataModel} party
 * @returns {Promise<EpisodeEndingData>}
 */
async function prepareEndingData(party) {
  const heroes = await party.getHeroes();
  /** @type EpisodeEndingData **/
  let data = {};
  data.groups = {
    "AH.EXPERIENCE.GROUP.Base": BASE_TRIGGER,
  };
  for (const hero of heroes) {

  }
  return data;
}

const Campaign = Object.freeze({
  prepareOpeningData,
  prepareEndingData,
});

export default Campaign;
