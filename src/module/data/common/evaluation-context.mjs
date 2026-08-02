import SourceInfo from "./source-info.mjs";
import Targeting from "../../helpers/targeting.mjs";

/**
 * @description Contains contextual objects used for evaluating expressions
 * @property {AHActor} actor The actor the expression is evaluated on
 * @property {AHItem} item  The item the expression is evaluated on
 * @property {AHActiveEffect} effect  The effect the expression is evaluated on
 * @property {AHActor[]} targets The targets the expression is evaluated on
 * @property {CheckResult|null} check The result of a check.
 * @property {SourceInfo} sourceInfo
 * @remarks Do not serialize this class, as it references full objects. Instead, store their uuids
 * and resolve them with the static constructor
 */
export default class EvaluationContext {

  /** @type {String} **/
  #itemUuid;

  constructor(actor, item, targets) {
    this.actor = actor;
    this.item = item;
    this.targets = targets;
    this.sourceInfo = SourceInfo.fromInstance(this.actor, this.item);
  }

  /**
   * Resolves source information.
   * @param {SourceInfo} sourceInfo
   * @param {AHActor[]} targets
   * @returns {EvaluationContext}
   */
  static fromSourceInfo(sourceInfo, targets) {
    // Actor
    let actor = undefined;
    if (sourceInfo.actorUuid !== undefined) {
      actor = fromUuidSync(sourceInfo.actorUuid);
    }
    // Item
    let item = undefined;
    if (sourceInfo.itemUuid !== undefined) {
      item = fromUuidSync(sourceInfo.itemUuid);
    }
    const context = new EvaluationContext(actor, item, targets);
    // Effect
    if (sourceInfo.effectUuid !== undefined) {
      context.effect = fromUuidSync(sourceInfo.effectUuid);
    }
    return context;
  }

  /**
   * @param {AHActor} actor The source of the action
   * @param {AHItem} item
   * @param {TargetData[]} targets
   * @returns {EvaluationContext}
   */
  static fromTargetData(actor, item, targets) {
    return new EvaluationContext(actor, item, Targeting.deserializeTargetData(targets));
  }

  /**
   * @param {CheckResult} check
   * @returns {EvaluationContext}
   */
  withCheck(check) {
    this.check = check;
    return this;
  }

  /**
   * @returns {AHActor} The single target of the expression
   */
  get target() {
    return this.targets[0];
  }

  /**
   * @returns {AHItem}
   */
  get sourceItem() {
    if (!this._source && this.#itemUuid) {
      this._source = fromUuidSync(this.#itemUuid);
    }
    return this._source;
  }

  /**
   * @param {String} sourceId
   */
  setSourceItem(sourceId) {
    this.#itemUuid = sourceId;
  }

  /**
   * @param {String} match
   */
  assertSource(match) {
    if (this.sourceItem == null) {
      // Can be evaluated very early
      if (ui.notifications) {
        ui.notifications.warn("AH.DIALOG.Warnings.MissingSource", { localize: true });
      }
      throw new Error(`No reference to a source provided while evaluating expression "${match}"`);
    }
  }

  /**
   * @description Resolves the actor or the target with the highest level
   * @returns {AHActor}
   */
  resolveActorOrHighestLevelTarget() {
    if (this.actor) {
      return this.actor;
    } else {
      if (this.targets.length > 1) {
        return this.targets.reduce((prev, current) => {
          return prev.system.level > current.system.level ? prev : current;
        });
      } else if (this.targets.length === 1) {
        return this.targets[0];
      }
    }

    ui.notifications.warn("AH.DIALOG.Warnings.MissingActor", { localize: true });
    throw new Error("No reference to an actor or targets provided while evaluating expression\"");
  }

  /**
   * @param {String} match
   * @param {Boolean} redirect
   * @param {Boolean} strict
   * @returns {AHActor}
   */
  resolveActorOrSource(match, redirect, strict = true) {
    if (redirect) {
      this.assertSource(match);
      const sourceActor = this.sourceItem.actor;
      if (!sourceActor) {
        if (strict) {
          ui.notifications.warn("AH.DIALOG.Warnings.MissingSource", { localize: true });
          throw new Error("The source item needs to be owned by an actor in order to evaluate the expression\"");
        } else {
          return undefined;
        }
      }
      return sourceActor;
    }
    this.assertActor(match);
    return this.actor;
  }

  /**
   * @param {String} match
   */
  assertActor(match) {
    if (this.actor == null) {
      ui.notifications.warn("AH.DIALOG.Warnings.MissingActor", { localize: true });
      throw new Error(`No reference to an actor provided while evaluating expression "${match}"`);
    }
  }

  /**
   * @param {String} match
   */
  assertEffect(match) {
    if (this.effect == null) {
      ui.notifications.warn("AH.DIALOG.Warnings.MissingEffect", { localize: true });
      throw new Error(`No reference to an effect provided while evaluating expression "${match}"`);
    }
  }

  /**
   * @param {String} match
   */
  assertSingleTarget(match) {
    if (this.targets.length !== 1) {
      ui.notifications.warn("AH.DIALOG.Warnings.SingleTarget", { localize: true });
      throw new Error(`Requires a single target for "${match}"`);
    }
  }

  /**
   * @param {String} match
   */
  assertActorOrTargets(match) {
    if ((this.targets.length === 0) && (this.actor == null)) {
      ui.notifications.warn("AH.DIALOG.Warnings.MissingActor", { localize: true });
      throw new Error(`No reference to an actor provided while evaluating expression "${match}"`);
    }
  }

  /**
   * @param {String} match
   */
  assertItem(match) {
    if (this.item == null) {
      ui.notifications.warn("AH.DIALOG.Warnings.MissingItem", { localize: true });
      throw new Error(`No reference to an item provided while evaluating expression "${match}"`);
    }
  }
}
