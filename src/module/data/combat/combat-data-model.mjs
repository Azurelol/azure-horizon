/**
 * A model to store system-specific information about combats.
 */
export default class CombatDataModel extends foundry.abstract.TypeDataModel {
  /**
   * Key information about this Combat subtype.
   */
  static get metadata() {
    return {
      type: "base",
    };
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {};
  }
}
