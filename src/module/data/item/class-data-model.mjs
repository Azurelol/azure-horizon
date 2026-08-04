import ItemDataModel from './item-data-model.mjs';
import ClassBenefitsDataModel from './fields/class-benefits-data-model.mjs';

/**
 * @property {ClassBenefitsDataModel} benefits
 */
export default class ClassDataModel extends ItemDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      benefits: new EmbeddedDataField(ClassBenefitsDataModel, {})
    });
  }
}
