import { PipelineRequest } from "../data/common/_module.mjs";

/**
 * @extends PipelineRequest
 * @property {DamageData} damageData
 */
export default class DamageRequest extends PipelineRequest {
  constructor(sourceInfo, targets, damageData, traits) {
    super(sourceInfo, targets, traits);
    this.damageData = damageData;
  }
}
