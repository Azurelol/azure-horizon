import { Pipeline, PipelineContext, PipelineRequest } from "./_module.mjs";
import AH from "../config.mjs";
import { StringUtils } from "../utils/_module.mjs";
import TokenUtils from "../utils/token-utils.mjs";
import { ChatMessageBuilder, ChatMessageSections, ChatSectionOrder, FlagBuilder } from "../helpers/_module.mjs";
import Flags from "../data/common/flags.mjs";

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
 * @property {String} message
 * @property {DamageResult} result Calculated during processing.
 * @property {Record<AH_DamageType, DamageBonus>} bonuses Gathered during processing.
 * @property {Boolean} pressured Whether the actor was pressured by the damage they took.
 * @property {String} pressureTrigger The pressure trigger (weapon group, affinity)
 */
class DamageContext extends PipelineContext {
  constructor(request, actor) {
    super(request, actor);
    this.bonuses = {};
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

    context.message = "AH.PIPELINE.ApplyDamage";
  }

  /**
   * @param {DamageRequest} request
   * @return {Promise<Awaited<unknown>[]>}
   */
  static async process(request) {
    if (!request.validate()) {
      return Promise.reject("Request was not valid");
    }

    const updates = [];
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

      let resource = "hp";
      let color = "red";
      let damageTaken = context.result.total;
      const difference = subject.system.parameters[resource].value - damageTaken;
      if (difference < 0) {
        damageTaken -= Math.abs(difference);
      }

      // If no damage was dealt or absorbed, exit early
      if (damageTaken === 0) {
        ui.notifications.warn(`The damage to ${subject.name} was reduced to 0.`);
        ChatMessage.create({
          speaker: ChatMessage.getSpeaker({ subject }),
          content: StringUtils.localize("AH.DIALOG.WARNING.ApplyNoDamage", {
            actor: subject.name,
            from: request.sourceInfo.name,
          }),
        });
        continue;
      }

      let content = [];
      // If the target was pressured (elites/solos)
      if (context.pressured) {
      }

      // Create the update
      updates.push(
        subject.modifyTokenAttribute(`parameters.${resource}`, -damageTaken, true).then(async (result) => {

          /** @type ChatMessageBuilderData **/
          let renderData = {
            tags: [],
            sections: [],
            postRenderActions: [],
            flags: [],
          };

          TokenUtils.showFloatyText(subject, `${-damageTaken} ${resource.toUpperCase()}`, color);

          // Chat message
          damageTaken = Math.abs(damageTaken);
          // Set flags
          const flags = new FlagBuilder();
          flags.set(Flags.ChatMessage.Damage, damageTaken);
          flags.set(Flags.ChatMessage.Source, context.sourceInfo);

          const chat = new ChatMessageBuilder(subject, request.item).withData(renderData);
          chat.withFlags(flags.toObject());

          ChatMessageSections.template(
            chat.sections,
            "chat/chat-section-apply-damage",
            {
              message: context.message,
              actor: subject.name,
              uuid: subject.uuid,
              rootUuid: subject.resolveUuid(),
              amount: damageTaken,
              content: content,
              result: context.result,
              from: request.sourceInfo.name,
              sourceActorUuid: request.sourceInfo.actorUuid,
              resource: resource.toUpperCase(),
              sourceItemUuid: request.sourceInfo.itemUuid,
              breakdown: context.breakdown,
            },
            ChatSectionOrder.details,
          );
          await chat.create();

          return result; // keep the result from modifyTokenAttribute if needed
        }),
      );

    }

    return Promise.all(updates);
  }

  static initialize() {

  }
}
