import { OptionalDataModel } from "../api/_module.mjs";
import AH from "../../config.mjs";

/**
 * @property {AH_Attribute} primary
 * @property {AH_Attribute} secondary
 * @property {AH_Defense} defense
 */
export default class CheckDataModel extends OptionalDataModel {
  static defineSchema() {
    const { SchemaField, StringField } = foundry.data.fields;
    return {
      primary: new StringField({ initial: "dex", blank: true, choices: Object.keys(AH.attributes) }),
      secondary: new StringField({ initial: "mig", blank: true, choices: Object.keys(AH.attributes) }),
      defense: new StringField({ initial: "def", choices: Object.keys(AH.defenses), blank: true }),
    };
  }
}
