import { Pipeline, PipelineContext, PipelineRequest } from "./_module.mjs";
import AH from "../config.mjs";

/**
 * @extends PipelineRequest
 * @property {DamageData} damageData
 */
export class DamageRequest extends PipelineRequest {
  constructor(sourceInfo, targets, damageData) {
    super(sourceInfo, targets);
    this.damageData = damageData;
  }
}

/**
 * @typedef DamageInstance
 * @property {AH_DamageType} type
 * @property {Number} amount
 */

/**
 * @typedef DamageResult
 * @property {DamageInstance} instances The distinct damage instances, with incremental/multiplicative bonuses already applied.
 * @property {Number} total The total damage, combining that of the distinct instances.
 */

/**
 * @property {DamageData} damageData
 * @property {DamageResult} result Calculated during processing.
 * @property {Record<AH_DamageType, DamageBonus>} bonuses Gathered during processing.
 * @property {Boolean} pressured Whether the actor was pressured by the damage they took.
 * @property {String} pressureTrigger The pressure trigger (weapon group, affinity)
 */
class DamageContext extends PipelineContext {
  constructor(request, actor) {
    super(request, actor);
  }

}

/**
 * Handles damage application onto characters.
 */
export default class Damage extends Pipeline {

  /**
   * @param {String} type
   */
  static isDamageType(type) {
    return type in AH.damageTypes;
  }

  /**
   * @param {DamageContext} context
   * @return {Promise<Boolean>}
   */
  static async collectIncrements(context) {

  }

  /**
   * @param {DamageContext} context
   * @return {Boolean}
   */
  static collectMultipliers(context) {

  }

  /**
   * @param {DamageContext} context
   * @return {Boolean}
   */
  static calculateResult(context) {

    /** @type DamageInstance[] **/
    let instances = [];
    for (const component of context.damageData.components) {
      let amount = component.amount;
      const bonus = context.bonuses[component.type];
      if (bonus) {
        amount += bonus.increment;
        amount *= bonus.multiplier;
      }
      instances.push({
        type: component.type,
        amount: amount,
      });
    }

    const total = instances.reduce((total, instance) => total + instance.amount, 0);

    context.result = {
      instances: instances,
      total: total,
    };

  }

  /**
   * @param {DamageRequest} request
   * @return {Promise<Awaited<unknown>[]>}
   */
  static async process(request) {
    if (!request.validate()) {
      return Promise.reject("Request was not valid");
    }
    for (const subject of request.targets) {
      if (!subject.isOwner) {
        ui.notifications.warn("AH.DIALOG.Warnings.DocumentOwnership", { localize: true });
        continue;
      }

      let context = new DamageContext(request, subject);
      ui.notifications.info(`Applying damage to ${context.subject.name}`, { localize: true });
      await Damage.collectIncrements(context);
      Damage.collectMultipliers(context);
      Damage.calculateResult(context);
      if (context.result === undefined) {
        throw new Error("Failed to generate result during pipeline");
      }
      // TODO: Apply damage, etc...
    }
  }

  static initialize() {

  }
}
