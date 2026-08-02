import { EvaluationContext, SourceInfo } from "../data/common/_module.mjs";

/**
 * @template T
 * @property {AHActiveEffect} effect
 * @property {String} type The event type
 * @property {CharacterInfo} character The character the rule element is being evaluated on.
 * @property {SourceInfo} sourceInfo
 * @property {CheckResult|null} check Some events may have check information.
 * @property {ActionConfig|null} config Configuration for a check, available in events involving the checks pipeline.
 * @property {ChatMessageBuilderData} renderData Used for rendering chat messages.
 * @property {AHItem|null} item The item the rule element could be on.
 * @property {CharacterInfo} source The source character of the event.
 * @property {CharacterInfo[]} targets The targets of the event.
 * @property {CharacterInfo[]} scene.characters All the characters involved in the scene.
 * @property {String} origin An unique identifier for the rule element
 * @property {String} label A human-readable identifier for the rule element
 * @property {T} event
 */
export default class RuleElementContext {
  constructor(data = {}) {
    Object.assign(this, data);
    this.sourceInfo = SourceInfo.fromInstance(data.character.actor, data.item, data.effect.name);
    this.origin = data.effect.id;
    this.label = data.effect.name;
  }

  /**
	 * @returns {AHActor[]}
	 */
  get targetActors() {
    return this.targets.map((target) => target.actor);
  }

  /**
	 * @returns {String} The event type, found in {@linkcode AH.hooks}
	 */
  get eventType() {
    return this.type;
  }

  /**
	 * @returns {AHItem}
	 */
  getItem() {
    if (this.event.item) {
      return this.event.item;
    }
    return this.item;
  }

  /**
	 * @param {String} id An identifier to match against.
	 * @return {Boolean}
	 */
  matchesItem(id) {
    let item;

    // Prioritize comparing against the event item
    if (this.event.item) {
      item = this.event.item;
    } else {
      item = this.item;
    }

    // If there's an item
    if (item) {
      // If we have provided an identifier, check against it
      if (id) {
        if (item.system.slug === id) {
          return true;
        }
        if (item.name.toLowerCase() === id.toLowerCase()) {
          return true;
        }
      }
    }
    return false;
  }

  /**
	 * @return {Boolean} True if the item in the event is that of the item the rule element is attached to.
	 */
  isLocalItem() {
    if (!this.item || !this.sourceInfo?.itemUuid) {
      return false;
    }

    if (this.event.sourceInfo) {
      return this.event.sourceInfo.itemUuid === this.sourceInfo.itemUuid;
    }

    if (this.event.item) {
      return this.event.item.uuid === this.sourceInfo.itemUuid;
    }

    return false;
  }

  /**
	 * @param {AH_TargetSelector} selector
	 * @returns {CharacterInfo[]}
	 */
  selectTargets(selector) {
    switch (selector) {
      case "source":
        return [this.source];
      case "initial":
        return this.targets;
      case "self":
        return [this.character];
      case "scene":
        return this.scene.characters;
      case "none":
        return [];
    }
    return null;
  }

  /**
	 * @param {CharacterInfo[]}  selected
	 * @returns {EvaluationContext}
	 */
  getExpressionContext(selected) {
    const targets = selected.map((t) => t.actor);
    return EvaluationContext.fromSourceInfo(this.sourceInfo, targets);
  }
}
