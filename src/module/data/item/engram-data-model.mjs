import EquipmentDataModel from "./equipment-data-model.mjs";

/**
 * An engram is an item that allows the user to cast magic or perform certain abilities they could not otherwise.
 * @property {AHItem} item The item this engram is slotted into.
 */
export default class EngramDataModel extends EquipmentDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, ForeignDocumentField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      // eslint-disable-next-line no-undef
      item: new ForeignDocumentField(Item, { nullable: true }),
    });
  }

  // TODO: Optimize
  get transferEffects() {
    if (this.parent.actor && (this.parent.actor.type === "hero")) {
      const system = this.parent.actor.system;
      const equipped = system.getEquippedItems();
      if (equipped?.engrams?.find(e => e.id === this.parent.id)) {
        return true;
      }
    }
    return false;
  }
}
