/**
 * @typedef RoleAttributes
 * @property {Number} dex
 * @property {Number} ins
 * @property {Number} mig
 * @property {Number} wlp
 */

// How often attributes change
const LEVEL_ATTRIBUTE_STEP = 10;
const ATTRIBUTE_BASE = 4;
const ATTRIBUTE_DIE_STEP = 2;
const LEVEL_CHECK_BONUS_STEP = 10;
const LEVEL_DAMAGE_BONUS_STEP = 20;

const LEVEL_DAMAGE_BONUS = 5;

/**
 * Defines information regarding an adversary role (such as brute, harrier, etc...)
 * @property {RoleAttributes[]} attributes As offsets.
 */
class Role {

  constructor(attributeSteps) {
    this.attributes = attributeSteps.map(arr => ({
      mig: arr[0], dex: arr[1], ins: arr[2], wlp: arr[3],
    }));

    // Precompute running totals so getAttributesForLevel is O(1)
    this.cumulativeAttributes = this.attributes.reduce((acc, offset) => {
      const prev = acc[acc.length - 1] ?? { mig: 0, dex: 0, ins: 0, wlp: 0 };
      acc.push({
        mig: prev.mig + offset.mig,
        dex: prev.dex + offset.dex,
        ins: prev.ins + offset.ins,
        wlp: prev.wlp + offset.wlp,
      });
      return acc;
    }, []);
  }

  getAttributesForLevel(level) {
    const step = Math.min(
      Math.floor(level / LEVEL_ATTRIBUTE_STEP) - 1,
      this.cumulativeAttributes.length - 1,
    );
    const totals = this.cumulativeAttributes[step];
    return {
      mig: ATTRIBUTE_BASE + (totals.mig * ATTRIBUTE_DIE_STEP),
      dex: ATTRIBUTE_BASE + (totals.dex * ATTRIBUTE_DIE_STEP),
      ins: ATTRIBUTE_BASE + (totals.ins * ATTRIBUTE_DIE_STEP),
      wlp: ATTRIBUTE_BASE + (totals.wlp * ATTRIBUTE_DIE_STEP),
    };
  }
}

// Characters start level 10 with 3 attribute points.
// Either: [+1 +1 +1] or [+2 +1]
// MIG, DEX, INS, WLP

const ATTRS = ["mig", "dex", "ins", "wlp"];

/**
 * Builds a 9-row attribute progression table.
 * Row 0 (BASE): primary +2, secondary +1.
 * Rows 1-8: cycle [secondary, tertiary, primary] +1 each, grouped
 * into three tiers of three (D8, D10, D12).
 * The 4th, unlisted attribute is always 0.
 *
 * @param {AH_Attribute} primary
 * @param {AH_Attribute} secondary
 * @param {AH_Attribute} tertiary
 * @returns {number[][]} 9-row table in [mig, dex, ins, wlp] column order
 */
function buildProgression(primary, secondary, tertiary) {
  const cycle = [secondary, tertiary, primary];

  const makeRow = (values) => ATTRS.map(attr => values[attr] ?? 0);

  const rows = [makeRow({ [primary]: 2, [secondary]: 1 })];

  for (let i = 1; i < 9; i++) {
    const attr = cycle[(i - 1) % 3];
    rows.push(makeRow({ [attr]: 1 }));
  }

  return rows;
}

/**
 * @type {Record<AH_RoleType, Number[][]>}>}
 */
const ROLES = Object.freeze({
  brute: new Role(buildProgression("mig", "mig", "ins")),
  harrier: new Role(buildProgression("dex", "mig", "ins")),
  defender: new Role(buildProgression("mig", "mig", "ins")),

  artillery: new Role(buildProgression("ins", "dex", "wlp")),
  controller: new Role(buildProgression("ins", "wlp", "dex")),
  supporter: new Role(buildProgression("wlp", "ins", "mig")),

  saboteur: new Role(buildProgression("dex", "ins", "wlp")),
  leader: new Role(buildProgression("wlp", "mig", "ins")),
});

/**
 * @typedef AssemblyData
 * @property {Number} level
 * @property {RoleAttributes} attributes
 * @property {Number} checkBonus
 * @property {Number} damageBonus
 */

export default class Assembly {

  /**
   * @param {AH_RoleType}  type
   * @param level
   * @returns {undefined|*}
   */
  static resolve(type, level) {
    const role = ROLES[type];
    if (!role) {
      return null;
    }

    let checkBonus = Math.floor(level / LEVEL_CHECK_BONUS_STEP);
    let damageBonus = Math.floor(level / LEVEL_DAMAGE_BONUS_STEP) * LEVEL_DAMAGE_BONUS;

    /** @type AssemblyData **/
    let data = {
      level: level,
      attributes: role.getAttributesForLevel(level),
      checkBonus,
      damageBonus,
    };

    return data;
  }
}
