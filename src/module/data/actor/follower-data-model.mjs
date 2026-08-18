import AH, { getFormSelectOptions } from "../../config.mjs";
import { FollowerProfileDataModel } from "./system/_module.mjs";
import EntityDataModel from "./entity-data-model.mjs";

/**
 * @property {AH_FollowerType} kind
 * @property {FollowerProfileDataModel} profile
 * @property {Number} potential
 */
export default class FollowerDataModel extends EntityDataModel {

  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, ForeignDocumentField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      kind: new StringField({ initial: "guest", blank: true, label: "AH.FOLLOWER.Kind", choices: Object.keys(AH.followerTypes), formOptions: getFormSelectOptions(AH.followerTypes), required: true }),
      potential: new NumberField({ initial: 0, max: AH.defaults.potential.max }),
      profile: new EmbeddedDataField(FollowerProfileDataModel, {}),
      references: new SchemaField({
        // eslint-disable-next-line no-undef
        actor: new ForeignDocumentField(Actor, { nullable: true }),
      }),
    });
  }

  supportsItemType(type) {
    return type === "move";
  }
}
