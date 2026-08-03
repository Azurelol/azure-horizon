import SubDocumentDataModel from "./sub-document-data-model.mjs";
import ModelCollection from "./model-collection.mjs";
import LazyTypedSchemaField from "./lazy-typed-schema-field.mjs";

const { TypedObjectField, EmbeddedDataField } = foundry.data.fields;

/**
 * @desc A collection that houses {@linkcode SubDocumentDataModel}, which can have different types.
 * @remarks Uses a custom internal field for its elements. Initialized to {@linkcode ModelCollection}
 */
export default class SubDocumentCollectionField extends TypedObjectField {

  /**
	 * The sub document class.
	 * @type {typeof SubDocumentDataModel}
	 */
  #documentClass;
  get documentClass() {
    return this.#documentClass;
  }

  /**
	 * @param {typeof SubDocumentDataModel} model   The value type of each entry in this object.
	 * @param {DataFieldOptions} [options]    Options which configure the behavior of the field.
	 * @param {DataFieldContext} [context]    Additional context which describes the field.
	 */
  constructor(model, options = {}, context = {}) {
    let field = foundry.utils.isSubclass(model, SubDocumentDataModel) ? new LazyTypedSchemaField(model.TYPES) : new EmbeddedDataField(model);
    options.validateKey ||= (key) => foundry.data.validators.isValidId(key);
    super(field, options, context);
    this.#documentClass = model;
  }

  /* -------------------------------------------------- */

  /** @inheritdoc */
  initialize(value, model, options = {}) {
    const documentName = this.documentClass.metadata.documentName;
    const collection = new ModelCollection(documentName, this.documentClass, model, value);
    collection.initialize(model, options);

    // options.collection = collection;
    // const init = super.initialize(value, model, options);
    // for (const [id, model] of Object.entries(init)) {
    //   if (model instanceof SubDocumentDataModel) {
    //     collection.set(id, model);
    //   } else {
    //     collection.setInvalid(model);
    //   }
    // }
    // collection.documentClass = this.documentClass;

    return collection;
  }

  /** @override */
  _updateCommit(source, key, value, diff, options) {
    let src = source[key];

    // Special Cases: * -> undefined, * -> null, undefined -> *, null -> *
    if (!src || !value) {
      source[key] = value;
      return;
    }

    // Reconstruct the source array, retaining object references
    for (let [id, d] of Object.entries(diff)) {
      if (foundry.utils.isDeletionKey(id)) {
        if (id.startsWith("-")) {
          delete source[key][id.slice(2)];
          continue;
        }
        id = id.slice(2);
      }
      const prior = src[id];
      if (prior) {
        this.element._updateCommit(src, id, value[id], d, options);
        src[id] = prior;
      }
      else src[id] = d;
    }
  }

  /**
   * @param {Document} document
	 * @param {SubDocumentCollectionField} field
	 * @param {CreateSubDocumentData} data
	 */
  static async addDocumentModel(document, field, data) {
    return field.documentClass.create(data, { parent: document });
  }
}
