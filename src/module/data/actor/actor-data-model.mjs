/**
 * Base class for data models used by actors in the system.
 */
export default class ActorDataModel extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["AH.Base"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  async _preCreate(data, options, user) {
    const allowed = await super._preCreate(data, options, user);
    if (allowed === false) return false;
  }

  /**
   * @param {AH_ItemType} type
   * @remarks By default, will reject non-supported items.
   */
  supportsItemType(type) {
    return false;
  }
}
