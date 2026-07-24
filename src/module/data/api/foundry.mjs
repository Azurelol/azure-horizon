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
