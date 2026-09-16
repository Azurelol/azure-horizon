
/**
 * @typedef AH_ItemReference
 * @property {String} name
 * @property {String} slug
 * @property {String} uuid
 */

export default class ItemInfo {

  /**
   * @param {AHItem} item
   * @returns {AH_ItemReference}
   */
  static toItemReference(item) {
    return {
      name: item.name,
      slug: item.system.slug,
      uuid: item.uuid,
    };
  }

  /**
   * @param {AHItem} item
   * @returns {AH_ItemGroup}
   */
  static resolveItemGroup(item) {
    let source;
    if (item) {
      /** @type AH_ItemType **/
      switch (item.type) {
        case "spell":
          source = "spell";
          break;
        case "weapon":
          source = "attack";
          break;
        case "skill":
          source = "skill";
          break;
        case "consumable":
          source = "item";
          break;
      }
    }
    return source;
  }
}
