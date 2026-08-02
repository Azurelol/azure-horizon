import EvaluationContext from "../data/common/evaluation-context.mjs";

/**
 * @property {SourceInfo} sourceInfo
 * @property {AHActor} actor The actor whose action triggered the pipeline
 * @property {AHItem} item The item of the actor that triggered the pipeline
 * @property {AHActor} subject The actor the pipeline is modifying
 * @property {Set<String>} traits
 * @property {Event | null} event
 * @property {?} result The result output
 */
export default class PipelineContext extends EvaluationContext {
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
