import { StringUtils } from "../../utils/_module.mjs";
import { VersionedDataModel } from "../api/_module.mjs";
import AH from "../../config.mjs";
import CodexEntryDataModel from "./codex-entry-data-model.mjs";

const fields = foundry.data.fields;

/**
 * Represents data about an ongoing campaign.
 * @property {CodexEntryDataModel[]} entries
 * @property {String[]} tags
 */
export default class CodexDataModel extends VersionedDataModel {
  static CURRENT_VERSION = 1;
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
      entries: new fields.ArrayField(new fields.EmbeddedDataField(CodexEntryDataModel), {}),
      tags: new fields.ArrayField(new fields.StringField({ initial: "", nullable: false, blank: true }), {
        initial: CodexDataModel.getDefaultTags(),
      }),
    });
  }

  /**
	 * @returns {String[]}
	 */
  static getDefaultTags() {
    return Object.entries(AH.codex.tags).map(([key, value]) => {
      if (StringUtils.hasLocalization(key)) {
        return StringUtils.localize(value).toLowerCase();
      }
      return key;
    });
  }

  /**
	 * @param {String} name
	 * @returns {CodexEntryDataModel}
	 */
  resolveEntry(name) {
    name = name.toLowerCase();
    for (const entry of this.entries) {
      if (entry.name.toLowerCase() === name) {
        return entry;
      }
    }
    return null;
  }
}
