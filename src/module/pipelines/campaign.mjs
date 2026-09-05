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
 * @typedef EpisodeEndingData
 */

/**
 * @param {PartyDataModel} party
 * @returns {Promise<EpisodeEndingData>}
 */
async function prepareEndingData(party) {

}

const Campaign = Object.freeze({
  prepareOpeningData,
  prepareEndingData,
});

export default Campaign;
