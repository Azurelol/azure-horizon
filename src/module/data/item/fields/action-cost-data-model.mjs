/**
 * @typedef ResourceExpense
 * @property {AH_Resource} resource
 * @property {String|Number} amount If it's an expression, it will be a string.
 * @property {Boolean} perTarget
 * @property {AH_ItemGroup} source
 * @property {Boolean} evaluated This is set by the resource pipeline.
 */

import AH from "../../../config.mjs";
import { StringUtils } from "../../../utils/_module.mjs";
import { systemTemplatePath } from "../../../constants.mjs";
import FieldsetDataModel from "../../api/fieldset-data-model.mjs";

/**
 * @property {AH_Resource} resource The resource type
 * @property {String} amount The resource cost
 * @property {boolean} perTarget Is the cost static or per target
 */
export class ActionCostDataModel extends FieldsetDataModel {
  static defineSchema() {
    const { StringField, BooleanField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      resource: new StringField({ initial: "mp", blank: true, choices: Object.keys(AH.resourceTypes), required: true }),
      amount: new StringField({ initial: "", blank: true, nullable: true }),
      perTarget: new BooleanField({ initial: false }),
    });
  }

  get assigned() {
    if (this.amount) {
      const _amount = Number.parseInt(this.amount);
      if (_amount >= 0) {
        return true;
      } else if (StringUtils.isExpression(this.amount)) {
        return false;
      }
    }
    return false;
  }

  /**
   * @param {ActionConfig} config
   * @return {Promise}
   */
  configureAction(config) {
    if (this.assigned) {
      config.addExpense({
        resource: this.resource,
        amount: this.amount,
        perTarget: this.perTarget,
        evaluated: false,
      });
    }
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/action-cost-data-model");
  }
}
