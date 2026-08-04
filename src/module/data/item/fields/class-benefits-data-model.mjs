import FieldsetDataModel from '../../api/fieldset-data-model.mjs';
import { systemTemplatePath } from '../../../constants.mjs';

export default class ClassBenefitsDataModel extends FieldsetDataModel {
  static defineSchema() {
    return Object.assign(super.defineSchema(), {
    });
  }

  static get template() {
    return systemTemplatePath("sheets/item/fields/class-benefits-data-model")
  }
}
