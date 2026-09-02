import { VersionedDataModel } from "../../api/_module.mjs";
import AH, { getFormSelectOptions } from "../../../config.mjs";
import { TraitsField } from "../../item/fields/_module.mjs";
import { ModifierDataField } from "../../api/modifiers.mjs";

const { SchemaField, StringField, BooleanField, NumberField, HTMLField, EmbeddedDataField } = foundry.data.fields;

/**
 * All modifiers that adversaries have configured during their assembly.
 * @remarks This is a subset of all possible modifiers, and is later input into {@linkcode CharacterParametersDataModel}
 */
class AdversaryModifiersDataModel extends VersionedDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
    });
  }
}

/**
 * @property {Set<AH_Family>} traits
 * @property {AH_RoleType} role The adversary role.
 * @property {AH_Rank} rank The adversary rank.
 * @property {Boolean} villain If the adversary is a villain.
 * @property {Number} turns For champion-level adversaries, how many turns should they get.
 * @property {String} summary
 * @property {String[]} pressure Traits that add pressure to this adversary.
 */
export default class AdversaryProfileDataModel extends VersionedDataModel {
  static defineSchema() {
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
      pressure: new TraitsField({
        label: "AH.DAMAGE.Pressure",
        _part: "header",
        formOptions: getFormSelectOptions(AH.traits.pressure),
      }),
      summary: new HTMLField(),
      revision: new NumberField({
        required: true,
        nullable: false,
        initial: 1,
        label: "AH.DOCUMENT.Revision",
        integer: true,
        config: false,
      }),
      slug: new StringField({
        required: false,
        blank: true,
        initial: "",
        config: false,
        label: "AH.DOCUMENT.Slug",
        validate: (value) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value),
      }),
      // TODO: Remove?
      modifiers: new EmbeddedDataField(AdversaryModifiersDataModel, {}),
    });
  }

  /**
   *
   */
  generateIntents() {

  }

  /**
   * A budget tracker for a single pool of adversary assembly points (attacks, abilities, etc.) -
   * how many have been spent (`current`) against how many are allotted (`available`).
   * @typedef {object} AH_AssemblyBudget
   * @property {number} current - Points currently spent from this pool.
   * @property {number} available - Total points allotted to this pool.
   */

  /**
   * Tracks the attacks assembled onto an adversary.
   * @typedef {AH_AssemblyBudget} AH_AttackAssemblyData
   * @property {AHItem[]} entries - The attack entries assembled so far.
   */

  /**
   * Tracks the abilities assembled onto an adversary, including where each was sourced from.
   * @typedef {AH_AssemblyBudget} AH_AbilityAssemblyData
   * @property {AHItem[]} entries - The ability entries assembled so far.
   * @property {Object<string, *>} sources - Maps ability entries to the source they were drawn from.
   */

  /**
   * Tracks resistance/vulnerability point budgets for an adversary's damage affinities.
   * @typedef {object} AH_AffinityAssemblyData
   * @property {AH_AssemblyBudget} resistances - Budget for assigned resistances.
   * @property {AH_AssemblyBudget} vulnerabilities - Budget for assigned vulnerabilities.
   * @property {String[]} pressureTriggers
   */

  /**
   * The full point-budget breakdown used when assembling an adversary from its rank/role config.
   * @typedef {object} AdversaryAssemblyData
   * @property {AH_AttackAssemblyData} attacks - Attack budget and assembled entries.
   * @property {AH_AbilityAssemblyData} abilities - Ability budget, assembled entries, and sources.
   * @property {AH_AffinityAssemblyData} affinities - Resistance/vulnerability budgets.
   */

  /**
   * @return AdversaryAssemblyData
   */
  prepareAssemblyData() {

    /** @type AdversaryAssemblyData **/
    let data = {
      attacks: {
        current: 0,
        entries: [],
        available: 0,
      },
      abilities: {
        current: 0,
        entries: [],
        sources: {},
        available: 0,
      },
      affinities: {
        resistances: {
          current: 0,
          available: 0,
        },
        vulnerabilities: {
          current: 0,
          available: 0,
        },
        current: 0,
        available: 0,
      },
    };

    /** @type AdversaryDataModel **/
    const system = this.parent;
    /** @type AHActor **/
    const actor = system.parent;

    // Attacks
    const attackItems = actor.getItemsByType("attack");
    let availableAttacks = 1;
    switch (this.rank) {
      case "elite":
      case "champion":
        availableAttacks += 1;
        break;
    }
    data.attacks.current = attackItems.length;
    data.attacks.available = availableAttacks;
    data.attacks.entries = attackItems;

    // Abilities
    const abilityItems = actor.getItemsByType("ability");
    data.abilities.entries = abilityItems;
    data.abilities.current = abilityItems.length;
    const level = system.level;
    data.abilities.available += data.abilities.sources.level = Math.round(level / 10);
    switch (this.rank) {
      case "elite":
        data.abilities.available += 1;
        break;
      case "champion":
        data.abilities.available += 2;
        break;
    }

    // Affinities + Pressure
    const affinities = system.affinities.entries.filter(af => af.preset || af.amount);
    data.affinities.current = affinities.length;
    data.affinities.pressureTriggers = Array.from(system.profile.pressure);

    let availableAffinities = 0;
    switch (this.rank) {
      case "standard":
        availableAffinities = 1;
        break;
      case "elite":
        availableAffinities = 2;
        break;
      case "champion":
        availableAffinities = 4;
        break;
    }
    data.affinities.available = availableAffinities;

    return data;
  }
}
