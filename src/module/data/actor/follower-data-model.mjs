import AH, { getFormSelectOptions } from "../../config.mjs";
import { FollowerProfileDataModel } from "./system/_module.mjs";
import EntityDataModel from "./entity-data-model.mjs";

/**
 * @property {AH_FollowerType} kind
 */
export default class FollowerDataModel extends EntityDataModel {

  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      kind: new StringField({ initial: "guest", blank: true, label: "AH.FOLLOWER.Kind", choices: Object.keys(AH.followerTypes), formOptions: getFormSelectOptions(AH.followerTypes), required: true }),
      profile: new EmbeddedDataField(FollowerProfileDataModel, {}),
    });
  }

  supportsItemType(type) {
    return type === "move";
  }
}
