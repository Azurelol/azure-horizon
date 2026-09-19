/**
 * @typedef RevealedAdversaryData
 * @property {Map<String, Modifier>} affinities The currently revealed affinities.
 * @property {Map<String, Boolean>} pressureTriggers
 * @property {String[]} traits
 */

/**
 * @typedef AdversaryProfileData
 * @property {String} uuid
 * @property {String} name
 * @property {String} img
 * @property {AH_Rank} rank
 * @property {AH_RoleType} role
 * @property {RevealedAdversaryData} revealed
 * @property {Number} analysis The analysis level from 1-3.
 */

/**
 * @param {PartyDataModel} partyData
 * @param {String} uuid
 * @param {Boolean} edit
 * @returns {Promise<void>}
 */
async function updateProfile(partyData, uuid, edit = true) {
  const existing = partyData.getAdversary(uuid);

  /** @type AHActor **/
  const actor = await fromUuid(existing.uuid);
  /** @type AdversaryProfileDataModel **/
  const profile = actor.system.profile;
  /** @type String[] **/
  const traits = Array.from(profile.traits);

  if (edit) {
  }
  else {
    existing.role = profile.role;
    existing.rank = profile.rank;
  }

  await partyData.updateAdversary(existing);
}

/**
 * @param {AHActor} actor
 * @returns {AdversaryProfileData}
 */
function constructData(actor) {
  let uuid = actor.resolveUuid();
  return {
    uuid: uuid,
    analysis: 1,
    name: actor.name,
    img: actor.img,
    rank: actor.system.profile.rank,
    role: actor.system.profile.role,
    revealed: {},
  };
}

const Analysis = Object.freeze({
  constructData,
  updateProfile,
});

export default Analysis;
