import { EvaluationContext, SourceInfo } from "../data/common/_module.mjs";

/**
 * @property {SourceInfo} sourceInfo
 * @property {AHItem} item The item that triggered the pipeline
 * @property {AHActor[]} targets
 * @property {AHActor} actor
 * @property {Set<String>} traits
 * @property {Event | null} event
 * @property {String} origin An unique identifier, provided to prevent cascading of a request.
 */
export class PipelineRequest {

  /**
   * @param {SourceInfo} sourceInfo
   * @param {AHActor[]} targets
   */
  constructor(sourceInfo, targets) {
    sourceInfo = sourceInfo instanceof SourceInfo ? sourceInfo : SourceInfo.fromObject(sourceInfo);
    this.sourceInfo = sourceInfo;
    this.targets = targets;
    this.traits = new Set();
    this.item = sourceInfo.resolveItem();
    this.actor = sourceInfo.resolveActor();
  }

  /**
   * @param {string | string[]} traits
   */
  addTraits(...traits) {
    // If the caller passed a single array, unwrap it
    if ((traits.length === 1) && Array.isArray(traits[0])) {
      traits = traits[0];
    }
    for (const t of traits) {
      this.traits.add(t);
    }
  }

  /**
   * @desc Records the id for this request, used to prevent event cascading
   * @param id
   */
  fromOrigin(id) {
    this.origin = id;
  }

  /**
   * @returns {boolean} Whether the request is in a valid state
   */
  validate() {
    if (!this.targets) {
      console.error("No targets assigned to request");
      return;
    }

    if (!Array.isArray(this.targets)) {
      console.error("Targets is not an array:", this.targets);
      return false;
    }

    return true;
  }
}

/**
 * @property {SourceInfo} sourceInfo
 * @property {AHActor} actor The actor whose action triggered the pipeline
 * @property {AHItem} item The item of the actor that triggered the pipeline
 * @property {AHActor} subject The actor the pipeline is modifying
 * @property {Set<String>} traits
 * @property {Event | null} event
 * @property {?} result The result output
 */
export class PipelineContext extends EvaluationContext {
  /**
   * @param {PipelineRequest} request
   * @param {AHActor} subject
   */
  constructor(request, subject) {
    super(request.actor, request.item, request.targets);
    Object.assign(this, request);
    this.subject = subject;
  }

  addTraits(traits) {
    for (const t of traits) {
      this.traits.add(t);
    }
  }

  removeTraits(traits) {
    for (const t of traits) {
      this.traits.remove(t);
    }
  }
}

export class Pipeline {
}
