
export default class ItemInfo {

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
