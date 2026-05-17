/**
 * A "turns belong to users rather than tokens" variant of combatant.
 */
export class Player extends foundry.abstract.TypeDataModel {
  /** @inheritdoc */
  static LOCALIZATION_PREFIXES = ["AH.Combat.player"];

  /* -------------------------------------------------- */

  /** @inheritdoc */
  static defineSchema() {
    return {
      user: new foundry.data.fields.ForeignDocumentField(foundry.documents.User),
    };
  }
}
