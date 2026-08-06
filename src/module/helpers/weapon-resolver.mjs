import AH from "../config.mjs";
import Dialogs from "./dialogs.mjs";
import { renderTemplate } from "../constants.mjs";
import { StringUtils } from "../utils/_module.mjs";

/**
 * @typedef WeaponData
 * Normalized weapon data.
 * @property {AH_DamageType} damage.type
 * @property {Number|String} damage.value
 * @property {Set<String>} traits

/**
 * @typedef WeaponResolution
 * @property {AHItem} item
 * @property {WeaponData} data The normalized weapon data.
 */

/**
 * @param {AHActor} actor
 * @param {'mainHand', 'offHand', 'phantom', 'armor'} slot
 * @return {AHItem|null}
 */
function getEquipment(actor, slot) {
  return (
    [actor.system.equipment[slot]]
      .filter((value) => value)
      .map((value) => actor.items.get(value))
      .filter((value) => value)
      .filter((value) => value.type in AH.attackTypes)
      .at(0) ?? null
  );
}

/**
 * @param {AHActor} actor
 * @returns {AHItem[]}
 */
function getEquippedWeapons(actor) {
  let equippedWeapons = [];

  if (actor.type === "hero") {
    const mainHand = getEquipment(actor, "mainHand");
    const offHand = getEquipment(actor, "offHand");
    const armor = getEquipment(actor, "armor");

    equippedWeapons.push(...new Set([mainHand, offHand, armor]));
  }
  if (actor.type === "adversary") {
    equippedWeapons.push(...actor.getItemsByType("attack"));
  }

  equippedWeapons = equippedWeapons.filter((value) => value != null);
  return equippedWeapons;
}

/**
 * @param {AHActor} actor
 * @return {Promise<WeaponResolution|null|false>} chosen weapon or false for no equipped weapons or null for no selection
 */
async function prompt(actor) {
  const equippedWeapons = getEquippedWeapons(actor);
  if (!equippedWeapons.length) {
    return false;
  }

  // IF there's only one equipped weapon
  if (equippedWeapons.length === 1) {
    return {
      item: equippedWeapons[0],
      data: normalizeData(equippedWeapons[0]),
    };
  }

  const title = StringUtils.localize("AH.DIALOG.SelectAttackTitle");
  const data = {
    equippedWeapons,
    AH,
  };
  const content = await renderTemplate("dialog/dialog-select-weapon", data);
  const result = await Dialogs.input({
    title, content,
  });
  if (result && result.selected) {
    const item = actor.items.get(result.selected) ?? null;
    if (item) {
      return {
        item: item,
        data: normalizeData(item),
      };
    }
    return null;
  } else {
    return null;
  }
}

/**
 * @param {AHItem} item
 * @returns {WeaponData}
 */
function normalizeData(item) {
  switch (item.type) {
    case "attack":
    case "weapon": {
      /** @type WeaponDataModel **/
      const system = item.system;
      return {
        check: system.check,
        damage: system.damage,
      };
    }
  }
  return undefined;
}

export const WeaponResolver = Object.freeze({
  prompt,
  getEquipment,
  getEquippedWeapons,
  normalizeData,
});
