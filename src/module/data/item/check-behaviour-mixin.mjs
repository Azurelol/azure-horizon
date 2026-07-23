import { CheckDataModel } from "../fields/_module.mjs";

/**
 * @category Mixins
 * @param {typeof Container} ContainerClass  The parent Container class being mixed.
 */
export function CheckFieldsetMixin(ContainerClass) {
  return class CheckFieldset extends ContainerClass {
    static defineSchema() {
      const { SchemaField, StringField, NumberField, EmbeddedDataField } = foundry.data.fields;
      return Object.assign(super.defineSchema(), {
        check: new EmbeddedDataField(CheckDataModel, {}),
      });
    }
  };
}
