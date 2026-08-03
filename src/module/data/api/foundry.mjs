/**
 * An abstract class which is a fundamental building block of numerous structures and concepts in Foundry Virtual
 * Tabletop. Data models perform several essential roles:
 *
 * * A static schema definition that all instances of that model adhere to.
 * * A workflow for data migration, cleaning, validation, and initialization such that provided input data is structured
 *   according to the rules of the model's declared schema.
 * * A workflow for transacting differential updates to the instance data and serializing its data into format suitable
 *   for storage or transport.
 *
 * DataModel subclasses can be used for a wide variety of purposes ranging from simple game settings to high complexity
 * objects like `Scene` documents. Data models are often nested; see the {@link DataModel.parent} property for more.
 *
 * @typedef DataModel
 * @template {object} [ModelData=object]
 * @template {DataModelConstructionContext} [ModelContext=DataModelConstructionContext]
 */

/**
 * @typedef DataFieldOptions
 * @property {boolean} [required=false]   Is this field required to be populated?
 * @property {boolean} [nullable=false]   Can this field have null values?
 * @property {boolean} [readonly=false]   Should the initialized (prepared) property of the DataModel instance for this
 *                                        field be read-only, i.e. nonwritable and nonconfigurable? The source value of
 *                                        a read-only field can still be changed by `updateSource`, but a source change
 *                                        won't necessarily be reflected on the prepared value. Usually the prepared
 *                                        value of a read-only field is effectively immutable, but not in all cases:
 *                                        for example, `EmbeddedCollectionField`. The `_id` field is a special behavior:
 *                                        the prepared property becomes nonconfigurable only after the source value
 *                                        becomes a nonnull value for the first time.
 * @property {boolean} [persisted=true]   Is a value of this field written to source data? A Non-persisted value is
 *                                        initialized (with its initial value), and ActiveEffects can use the field
 *                                        for change application.
 * @property {boolean} [gmOnly=false]     Can this field only be modified by a gamemaster or assistant gamemaster?
 * @property {Function|*} [initial]       The initial value of a field, or a function which assigns that initial value.
 * @property {string} [label]             A localizable label displayed on forms which render this field.
 * @property {string} [hint]              Localizable help text displayed on forms which render this field.
 * @property {string} [placeholder]  Localizable text displayed in placeholders of form inputs which render this field.
 * @property {DataFieldValidator} [validate] A custom data field validation function.
 * @property {string} [validationError]   A custom validation error string. When displayed will be prepended with the
 *                                        document name, field name, and candidate value. This error string is only
 *                                        used when the return type of the validate function is a boolean. If an Error
 *                                        is thrown in the validate function, the string message of that Error is used.
 */

/**
 * @typedef DataFieldContext
 * @property {string} [name]               A field name to assign to the constructed field
 * @property {DataField} [parent]          Another data field which is a hierarchical parent of this one
 */

/**
 * @typedef DataFieldValidationOptions
 * @property {boolean} [partial]   Whether this is a partial schema validation, or a complete one.
 * @property {boolean} [fallback]  Whether to allow replacing invalid values with valid fallbacks.
 * @property {object} [source]     The full source object being evaluated.
 * @property {boolean} [strict=false] Whether to throw a DataModelValidationFailure (true) or simply return it (false)
 * @property {boolean} [dropInvalidEmbedded]  If true, invalid embedded documents will emit a warning and be placed in
 *                                            the invalidDocuments collection rather than causing the parent to be
 *                                            considered invalid.
 * @param {"pre"|"recursive"|"post"} [phase]  A specific validation phase to perform, specifying this is generally
 *                                  only necessary for _updateDiff workflows
 *                                    - "pre" occurs before recursion to child nodes
 *                                    - "recursive" performs recursive validation of child nodes
 *                                    - "post" occurs after validation of child nodes
 * @property {boolean} [recursive=true] When validating a field, also validate its children. This can be explicitly
 *                                  set to false to efficiently validate the outer field without validating its
 *                                  contained values.
 * @property {DataModel} [model]    The DataModel instance the field belongs to
 */

/**
 * @typedef DataModelCleaningOptions
 * @property {boolean} [addTypes=false]   Impute types for polymorphic so that those typed fields can be later used or
 *                                        validated
 * @property {boolean} [copy=true]        Copy the provided input data to avoid mutating the provided source
 * @property {boolean} [expand=true]      Automatically expand any flattened objects encountered during cleaning
 * @property {boolean} [migrate=true]     Apply model-specific data migrations
 * @property {boolean} [model=true]       Apply joint model-level cleaning rules
 * @property {boolean} [partial=false]    Perform partial cleaning only on the subset of keys included in the input
 *                                        data. If partial is `false`, values for keys missing in the input data will be
 *                                        imputed if possible
 * @property {boolean} [prune=true]       Remove keys which do not belong to the defined data schema
 * @property {boolean} [persisted=true]   Remove keys corresponding with non-persisted DataFields.
 * @property {boolean|DataModelSanitizationOptions} [sanitize]  Configuration of user input sanitization steps that are
 *                                        applied as part of cleaning. For internal server-side use only.
 */

/**
 * @typedef DataModelUpdateState
 * @property {boolean} [creation]         Are we in the context of a new model creation?
 * @property {DataModel} [model]          The DataModel instance being cleaned
 * @property {any} [source]               Prior source data at the current node
 * @property {object} [modelSource]       Prior source data at the nearest DataModel root being cleaned
 * @property {boolean} [expanded]         Has source data already been expanded?
 * @property {object} [sanitization]      Metadata resulting from sanitization workflows
 * @property {string} [documentId]        In a Document context, records its _id
 * @property {string} [documentType]      In a Document context, records its base type
 * @property {number} [modifiedTime]      In a ServerDocument context, records the timestamp of modification
 * @property {User} [user]                In a ServerDocument context, records the user performing the operation
 * @property {boolean} [cleanOptions]     Have the {@link DataModelCleaningOptions} been fully populated?
 */

/**
 * @typedef DataModelSanitizationOptions
 * @property {boolean} [creation=false]     Sanitization as part of creation?
 * @property {string} [assetPath]           A file path to which sanitized assets should be persisted to disk
 * @property {boolean} [skipSystem=false]   Skip system sanitization?
 * @property {User} [user]                  The User performing an operation which requires sanitization
 * @property {boolean} [deleteStats=false]  Clean data out of stats?
 */

/**
 * An extension of the base DataModel which defines a Document.
 * Documents are special in that they are persisted to the database and referenced by _id.
 * @abstract
 * @typedef Document
 *
 * @template {object} [DocumentData=object] Initial data from which to construct the Document
 * @template {DocumentConstructionContext} [DocumentContext=DocumentConstructionContext] Construction context options
 *
 * @property {string|null} _id                    The document identifier, unique within its Collection, or null if the
 *                                                Document has not yet been assigned an identifier
 * @property {string} [name]                      Documents typically have a human-readable name
 * @property {DataModel} [system]                 Certain document types may have a system data model which contains
 *                                                subtype-specific data defined by the game system or a module
 * @property {DocumentStats} [_stats]             Primary document types have a _stats object which provides metadata
 *                                                about their status
 * @property {DocumentFlags} flags                Documents each have an object of arbitrary flags which are used by
 *                                                systems or modules to store additional Document-specific data
 * @extends {DataModel<DocumentData, DocumentContext>}
 */

/**
 * @typedef DragDropConfiguration
 * @property {string|null} [dragSelector=null]  The CSS selector used to target draggable elements.
 * @property {string|null} [dropSelector=null]  The CSS selector used to target viable drop targets.
 * @property {Record<"dragstart"|"drop", (selector: string) => boolean>} [permissions]
 *                                         Permission tests for each action
 * @property {Record<
 *  "dragstart"|"dragover"|"drop"|"dragenter"|"dragleave"|"dragend",
 *  (event: DragEvent) => void
 * >} [callbacks]                         Callback functions for each action
 */

/**
 * @typedef ApplicationDragDropConfiguration
 * @property {DragDropConfiguration[]} dragDrop
 */
