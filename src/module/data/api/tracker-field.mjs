const { SchemaField, NumberField, StringField, EmbeddedDataField, ArrayField } = foundry.data.fields;

/**
 * @typedef TrackerFieldOptions
 * @property {Number} min
 * @property {Number} max
 */

export class TrackerField extends SchemaField {
  /**
   * @param {TrackerFieldOptions} options
   */
  constructor(options = {}) {
    super({
      current: new NumberField({ initial: options.min ?? 0, min: options.min ?? 0, integer: true, nullable: false }),
      max: new NumberField({ initial: 1, min: 1, integer: true, nullable: false }),
    }, options);
  }

  /**
   * @override
   * @param {FormInputConfig} config
   * @returns {HTMLDivElement}
   * @private
   */
  _toInput(config) {
    const container = document.createElement("div");
    container.classList.add("ah-tracker-field");

    const currentField = this.fields.current;
    const currentInput = currentField.toInput({
      ...config,
      name: `${config.name}.current`,
      dataset: {
        tooltip: "AH.FIELD.Current",
      },
      classes: "ah-tracker-field__current",
      value: config.value?.current ?? "",
    });
    container.append(currentInput);

    const divider = document.createElement("span");
    divider.classList.add("ah-tracker-field__divider");
    container.append(divider);

    const maxField = this.fields.max;
    const maxInput = maxField.toInput({
      ...config,
      name: `${config.name}.max`,
      classes: "ah-tracker-field__max",
      dataset: {
        tooltip: "AH.FIELD.Maximum",
      },
      value: config.value?.max ?? "",
    });
    container.append(maxInput);

    return container;
  }
}
