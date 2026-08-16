import ActorDataModel from "./actor-data-model.mjs";
import AH, { getFormSelectOptions } from "../../config.mjs";

export default class FollowerDataModel extends ActorDataModel {

  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      kind: new StringField({ initial: "guest", blank: true, label: "AH.FOLLOWER.Kind", choices: Object.keys(AH.followerTypes), formOptions: getFormSelectOptions(AH.followerTypes), required: true }),
    });
  }
}
