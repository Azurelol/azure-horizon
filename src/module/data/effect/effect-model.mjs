/**
 * A data model used by default effects with properties to control the expiration behavior.
 */
export default class EffectModel extends foundry.data.ActiveEffectTypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return Object.assign(super.defineSchema(), {});
  }
}
