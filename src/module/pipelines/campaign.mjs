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

const BASE_TRIGGERS = [
  "AH.EXPERIENCE.TRIGGERS",
];

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
  // Add the base set of triggers
  data.groups = {
    "AH.EXPERIENCE.GROUP.Base": BASE_TRIGGERS,
  };
  // For each hero class
  for (const hero of heroes) {
    for (const classItem of hero.actor.getItemsByType("class")) {
      /** @type ClassDataModel **/
      const classData = classItem.system;
      if (!data.groups[classData.slug]) {
        data.groups[classData.slug] = Array.from(classData.triggers);
      }
    }

  }
  return data;
}

const Campaign = Object.freeze({
  prepareOpeningData,
  prepareEndingData,
});

export default Campaign;
