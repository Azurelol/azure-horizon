import SourceInfo from "../data/common/source-info.mjs";

/**
 * @property {SourceInfo} sourceInfo
 * @property {AHItem} item The item that triggered the pipeline
 * @property {AHActor[]} targets
 * @property {AHActor} actor
 * @property {Set<String>} traits
 * @property {Event | null} event
 * @property {String} origin An unique identifier, provided to prevent cascading of a request.
 */
export default class PipelineRequest {

  /**
   * @param {SourceInfo} sourceInfo
   * @param {AHActor[]} targets
   * @param {String[]} traits
   */
  constructor(sourceInfo, targets, traits = []) {
    sourceInfo = sourceInfo instanceof SourceInfo ? sourceInfo : SourceInfo.fromObject(sourceInfo);
    this.sourceInfo = sourceInfo;
    this.targets = targets;
    this.traits = new Set(traits);
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
