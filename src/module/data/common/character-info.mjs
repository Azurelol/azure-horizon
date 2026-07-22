const dispositions = {
  [-1]: "hostile",
  [0]: "neutral",
  [1]: "friendly",
};

/**
 * @param {AHActor} actor
 * @param {TokenDocument} token
 * @returns {String|null}
 */
function resolveDisposition(actor, token) {
  const dispositionIndex = token?.disposition ?? actor?.prototypeToken.disposition;
  return dispositions[dispositionIndex] ?? null;
}

/**
 * @description Contains information about a target in a combat event
 * @typedef CharacterInfo
 * @property {Token} token
 * @property {AHActor} actor
 * @property {null|"friendly"|"hostile"} disposition
 * @property {AHCombatant|null} combatant If available, the combatant data
 * @property {TargetData|null} data
 */
export default class CharacterInfo {

  constructor(data) {
    Object.assign(this, data);
  }

  /**
   * @param {AHActor} actor
   * @returns {CharacterInfo|null}
   */
  static fromActor(actor) {
    if (!actor) return null;
    const token = actor.resolveToken();
    const disposition = resolveDisposition(actor, token);
    return new CharacterInfo({
      actor: actor,
      token: token,
      disposition: disposition,
    });
  }

  /**
   * @param {AHActor[]} actors
   * @returns {CharacterInfo[]}
   */
  static fromActors(actors) {
    return actors.map(CharacterInfo.fromActor);
  }

  /**
   * @param {AHCombatant[]} combatants
   * @returns {CharacterInfo[]}
   */
  static fromCombatants(combatants) {
    return combatants.map((c) => {
      /** @type {CharacterInfo} */
      return new CharacterInfo({
        actor: c.actor,
        token: c.token,
        combatant: c,
        disposition: resolveDisposition(c.actor, c.token),
      });
    });
  }

  /**
   * @param {AHCombatant} combatant
   * @returns {CharacterInfo}
   */
  static fromCombatant(combatant) {
    /** @type {CharacterInfo} */
    return new CharacterInfo({
      actor: combatant.actor,
      token: combatant.token,
      combatant: combatant,
      disposition: resolveDisposition(combatant.actor, combatant.token),
    });
  }

  /**
   * @param {TargetData[]} targets
   * @returns {CharacterInfo[]}
   */
  static fromTargetData(targets) {
    return targets.map((t) => {
      const actor = fromUuidSync(t.uuid);
      const token = actor.resolveToken();
      const disposition = resolveDisposition(actor, token);
      /** @type {CharacterInfo} */
      return new CharacterInfo({
        actor: actor,
        token: token,
        data: t,
        disposition: disposition,
      });
    });
  }
}
