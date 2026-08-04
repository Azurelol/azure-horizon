import FeatureDataModel from './feature-data-model.mjs';
import AH from '../../config.mjs';

/**
 * A spell is a feature tied to a magical domain.
 * @property {AH_Domain} domain
 */
export default class SpellDataModel extends FeatureDataModel {
  /** @inheritdoc */
  static defineSchema() {
    const { SchemaField, EmbeddedDataField, StringField, HTMLField, NumberField } = foundry.data.fields;
    return Object.assign(super.defineSchema(), {
      domain: new StringField({initial: "", blank: true, choices: Object.keys(AH.domains)})
    });
  }
}
