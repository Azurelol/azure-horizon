/**
 * @typedef DefenseData
 * @property {Number} def
 * @property {Number} mdef
 * @property {Number} dex
 * @property {Number} ins
 * @property {Number} mig
 * @property {Number} wlp
 */

/**
 * @typedef TargetData
 * @property {string} name The name of the actor
 * @property {string} uuid The uuid of the actor
 * @property {string} link An html link to the actor
 * @property {DefenseData} defenses
 * @property {number} difficulty
 * @property {"none", "hit", "miss"} result Updated during evaluation
 * @property {Boolean} isOwner
 */

/**
 * @param {AHActor} actor
 * @returns {TargetData}
 */
function constructData(actor) {
  /** @type TargetData **/
  return {
    name: actor.name,
    uuid: actor.uuid,
    link: actor.link,
    result: "none",
    defenses: {
      def: actor.system.derived.def.value,
      mdef: actor.system.derived.mdef.value,
      dex: actor.system.attributes.dex.current,
      ins: actor.system.attributes.ins.current,
      mig: actor.system.attributes.mig.current,
      wlp: actor.system.attributes.wlp.current,
    },
    isOwner: actor.isOwner,
  };
}

/**
 * @param {AHActor[]} targets
 * @return {TargetData[]}
 */
function serializeTargetData(targets) {
  return targets.map((target) => {
    return constructData(target);
  });
}

/**
 * @param {TargetData[]} targetData
 * @return {AHActor[]}
 */
function deserializeTargetData(targetData) {
  return targetData.map((t) => fromUuidSync(t.uuid));
}

/**
 * @returns {Promise<AHActor[]>}
 */
async function getSelected(warn = true) {
  const targets = canvas.tokens.controlled.map((token) => token.document.actor).filter((actor) => actor);

  if ((targets.length === 0) && warn) {
    ui.notifications.warn("AH.DIALOG.WARNING.MissingSelection", { localize: true });
  }
  return targets || [];
}

/**
 * @param {Boolean} tokens returns targeted tokens instead of actors if true
 * @param {Boolean} warn
 * @return {AHActor[] | Token[]}
 */
function getTargeted(tokens = false, warn = true) {
  const targets = Array.from(game.user.targets)
    .map((target) => (tokens ? target : target.actor))
    .filter((actor) => actor);

  if ((targets.length === 0) && warn) {
    ui.notifications.warn("AH.DIALOG.WARNING.MissingTargeting", { localize: true });
  }
  return targets || [];
}

/**
 * @returns {TargetData[]}
 */
function getSerializedTargetData() {
  const targets = getTargeted(false, false);
  return serializeTargetData(targets);
}

const Targeting = Object.freeze({
  rule: {
    self: "self",
    single: "single",
    multiple: "multiple",
    special: "special",
  },

  getSerializedTargetData,
  serializeTargetData,
  deserializeTargetData,
  constructData,

  getSelected,
  getTargeted,
});

export default Targeting;
