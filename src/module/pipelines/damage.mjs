import { Pipeline, PipelineContext, PipelineRequest } from "./_module.mjs";

export class DamageRequest extends PipelineRequest {
  constructor(sourceInfo, targets) {
    super(sourceInfo, targets);
  }
}

class DamageContext extends PipelineContext {
  constructor(request, actor) {
    super(request, actor);
  }

}

export default class Damage extends Pipeline {

  /**
   * @param {DamageRequest} request
   * @return {Promise<Awaited<unknown>[]>}
   */
  static async process(request) {
    if (!request.validate()) {
      return Promise.reject("Request was not valid");
    }
    for (const actor of request.targets) {
      if (!actor.isOwner) {
        ui.notifications.warn("AH.DIALOG.Warnings.DocumentOwnership", { localize: true });
        continue;
      }

      let context = new DamageContext(request, actor);
      // TODO: Apply damage, etc...
    }
  }

  static initialize() {

  }
}
