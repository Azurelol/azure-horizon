import { VersionedDataModel } from "../../api/_module.mjs";
import AH, { getFormSelectOptions } from "../../../config.mjs";
import { TraitsField } from "../../item/fields/_module.mjs";

/**
 * @property {Set<AH_Family>} traits
 * @property {AH_RoleType} role The adversary role.
 * @property {AH_Rank} rank The adversary rank.
 * @property {Boolean} villain If the adversary is a villain.
 * @property {Number} turns For champion-level adversaries, how many turns should they get.
 */
export default class AdversaryProfileDataModel extends VersionedDataModel {
  static defineSchema() {
    const { SchemaField, StringField, BooleanField, NumberField, HTMLField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      traits: new TraitsField({
        label: "AH.FIELD.Traits",
        options: getFormSelectOptions(AH.traits.weapon),
      }),
      family: new StringField({ initial: "standard", choices: Object.keys(AH.rank) }),
      role: new StringField({ initial: "custom", choices: Object.keys(AH.role) }),
      villain: new BooleanField(),
      rank: new StringField({ initial: "standard", choices: Object.keys(AH.rank) }),
      turns: new NumberField({ initial: 1, min: 0, max: 6 }),
    });
  }
}
