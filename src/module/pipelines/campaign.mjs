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
 * @typedef ExperienceTrigger
 * @property {String} text
 * @property {Number} amount
 */

/**
 * @typedef ExperienceTriggerGroup
 * @property {PartyHeroData[]} heroes The heroes that can make use of this trigger.
 * @property {String} label
 * @property {ExperienceTrigger[]} triggers
 */

/**
 * @type {ExperienceTriggerGroup}
 */
const BASE_TRIGGERS = {
  label: "AH.EXPERIENCE.GROUP.Base",
  triggers: [
    {
      text: "AH.EXPERIENCE.TRIGGERS.Scheduling",
      amount: 5,
    },
    {
      text: "AH.EXPERIENCE.TRIGGERS.Location",
      amount: 1,
    },
    {
      text: "AH.EXPERIENCE.TRIGGERS.Adversary",
      amount: 1,
    },
  ],
};

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
    base: BASE_TRIGGERS,
  };
  // For each hero class
  for (const hero of heroes) {
    for (const classItem of hero.actor.getItemsByType("class")) {
      /** @type ClassDataModel **/
      const classData = classItem.system;
      const key = classData.slug;
      if (!data.groups[key]) {
        data.groups[key] = {
          label: key,
          heroes: [hero],
          triggers: Array.from(classData.triggers).map((t) => {
            return { text: t, amount: 1 };
          }),
        };
      }
      else {
        data.groups[key].heroes.push(hero);
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
