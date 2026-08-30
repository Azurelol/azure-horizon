import AH from "../config.mjs";
import { CharacterInfo, ItemInfo, SourceInfo } from "../data/common/_module.mjs";
import { ActionConfig, ActionInspector, AsyncHooks } from "../helpers/_module.mjs";

/**
 * @typedef TrackUpdateEvent
 * @description Dispatched when a progress track has been updated
 * @property {Document} document The document that has the tracker
 * @property {TrackerDataModel} track The tracker in question
 * @property {"add"|"remove"|"update"} action The action that was performed
 * @property {Number|undefined} increment If an update was performed, the change in the tracker,
 * @property {Document|undefined} source If an update was performed, the source behind the change.
 */

function track(document, track, action, increment = undefined, source = undefined) {
  /** @type TrackUpdateEvent  **/
  const event = {
    document: document,
    track: track,
    action: action,
    increment: increment,
    source: source,
  };
  Hooks.call(AH.hooks.TRACK_EVENT, event);
}

/**
 * @description Dispatched when an actor updates its resources (such as HP, MP)
 * @typedef CalculateExpenseEvent
 * @property {ResourceExpense} expense
 * @property {CharacterInfo} source
 * @property {AHItem} item
 * @property {CharacterInfo[]} targets
 */

/**
 * @param actor
 * @param item
 * @param {TargetData[]} targetData
 * @param {ResourceExpense} expense
 * @returns {Promise}
 */
async function calculateExpense(actor, item, targetData, expense) {
  const source = CharacterInfo.fromActor(actor);
  const targets = CharacterInfo.fromTargetData(targetData);
  /** @type CalculateExpenseEvent  **/
  const event = {
    expense: expense,
    item: item,
    source: source,
    targets: targets,
  };
  return AsyncHooks.callSequential(AH.hooks.CALCULATE_EXPENSE_EVENT, event);
}

/**
 * @description Dispatched when an actor suffers damage
 * @typedef DamageEvent
 * @property {CharacterInfo|null} source
 * @property {CharacterInfo} target
 * @property {DamageResult} damage
 * @property {SourceInfo} sourceInfo
 * @property {AHItem} item
 * @property {AH_ItemGroup} itemGroup
 * @property {ChatMessageBuilderData} renderData
 * @property {String} origin An id used to prevent cascading.
 */

async function applyDamage(damage, item, sourceInfo, sourceActor, targetActor, origin, renderData) {
  const source = CharacterInfo.fromActor(sourceActor);
  const target = CharacterInfo.fromActor(targetActor);
  const itemGroup = ItemInfo.resolveItemGroup(item);

  /** @type DamageEvent  **/
  const damageEvent = {
    damage: damage,
    item: item,
    source: source,
    sourceActor: sourceInfo,
    itemGroup: itemGroup,
    target: target,
    origin: origin,
    renderData: renderData,
  };
  return AsyncHooks.callSequential(AH.hooks.APPLY_DAMAGE_EVENT, damageEvent);
}

/**
 * @typedef CalculateDamageEvent
 * @property {CharacterInfo} source
 * @property {AHItem} item
 * @property {AH_DamageType[]} types
 * @property {AH_ItemGroup} itemGroup
 * @property {CharacterInfo[]} targets
 * @property {ActionConfig} config
 */

function calculateDamage(actor, item, config) {
  const itemGroup = ItemInfo.resolveItemGroup(item);
  const targets = config.getTargets();
  const event = {
    source: CharacterInfo.fromActor(actor),
    targets: CharacterInfo.fromTargetData(targets),
    item: item,
    itemGroup: itemGroup,
    config: config,
    types: config.damage.type,
  };
  Hooks.call(AH.hooks.CALCULATE_DAMAGE_EVENT, event);
}

/**
 * @typedef CalculateResourceEvent
 * @property {CharacterInfo} source
 * @property {ResourceData} data
 * @property {AHItem} item
 * @property {AH_ItemGroup} itemGroup
 * @property {CharacterInfo[]} targets
 * @property {ActionConfig} config
 */

/**
 * @param {AHActor} actor
 * @param {AHItem} item
 * @param {ActionConfig} config
 * @returns {Promise<void>}
 */
async function calculateResource(actor, item, config) {
  const itemGroup = ItemInfo.resolveItemGroup(item);
  const targets = config.getTargets();
  const data = config.resource;
  const event = {
    source: CharacterInfo.fromActor(actor),
    targets: CharacterInfo.fromTargetData(targets),
    item: item,
    itemGroup: itemGroup,
    data: data,
    config: config,
  };
  await AsyncHooks.callSequential(AH.hooks.CALCULATE_RESOURCE_EVENT, event);
}

/**
 * @description Dispatched when an actor has a status toggled.
 * @typedef StatusEvent
 * @property {CharacterInfo} character
 * @property {String} status The id of the status effect
 * @property {String} enabled Whether the effect is enabled
 */

/**
 * @description Dispatches an event to signal an effect has been applied onto an actor
 * @param {AHActor} actor
 * @param {String} statusEffectId
 * @param {Boolean} enabled
 */
function status(actor, statusEffectId, enabled) {
  const character = CharacterInfo.fromActor(actor);
  Hooks.call(
    AH.hooks.STATUS_EVENT,
    /** @type StatusEvent **/
    {
      character: character,
      status: statusEffectId,
      enabled: enabled,
    },
  );
}

/**
 * @typedef PrepareCheckEvent
 * @property {CheckOptions} check
 * @property {CharacterInfo} source
 * @property {SourceInfo} sourceInfo
 * @property {AH_ItemGroup} itemGroup
 * @property {Object} flags
 * @remarks Emitted when a check is about to be rendered.
 */

async function prepareCheck(check, actor, item) {
  const sourceInfo = SourceInfo.fromInstance(actor, item);
  const source = CharacterInfo.fromActor(actor);
  /** @type PrepareCheckEvent  **/
  const event = {
    check: check,
    source: source,
    sourceInfo: sourceInfo,
    itemGroup: ItemInfo.resolveItemGroup(item),
  };
  return AsyncHooks.callSequential(AH.hooks.PREPARE_CHECK_EVENT, event);
}

/**
 * @typedef PerformActionEvent *
 * @property {ActionConfig} config
 * @property {CharacterInfo} source
 * @property {SourceInfo} sourceInfo
 * @property {CharacterInfo[]} targets
 * @property {AHItem} item
 * @property {AH_ItemGroup} itemGroup
 * @remarks Emitted when a check is about to be performed
 */
async function performAction(config, actor, item) {
  const sourceInfo = SourceInfo.fromInstance(actor, item);
  const source = CharacterInfo.fromActor(actor);
  const targetData = config.getTargets();
  let targets = [];
  if (targetData) {
    targets = CharacterInfo.fromTargetData(targetData);
  }
  /** @type PerformActionEvent  **/
  const event = {
    config: config,
    source: source,
    item: item,
    itemGroup: ItemInfo.resolveItemGroup(item),
    sourceInfo: sourceInfo,
    targets: targets,
  };
  return AsyncHooks.callSequential(AH.hooks.PERFORM_ACTION_EVENT, event);
}

/**
 * @typedef ResolveActionEvent
 * @property {ActionInspector} action
 * @property {CharacterInfo} source
 * @property {AHItem} item
 * @property {AH_ItemGroup} itemGroup
 * @property {CharacterInfo[]} targets
 * @property {SourceInfo} sourceInfo
 * @remarks Emitted when a check is about to be performed
 */

function resolveAction(action, actor, item) {
  const sourceInfo = SourceInfo.fromInstance(actor, item);
  const source = CharacterInfo.fromActor(actor);
  const targets = action.getTargets();

  /** @type ResolveActionEvent  **/
  const event = {
    action: action,
    source: source,
    item: item,
    itemGroup: ItemInfo.resolveItemGroup(item),
    sourceInfo: sourceInfo,
    targets: CharacterInfo.fromTargetData(targets),
  };
  Hooks.call(AH.hooks.RESOLVE_ACTION_EVENT, event);
}

/**
 * @typedef RenderActionEvent
 * @property {ChatMessageSectionCollection} renderData
 * @property {ActionInspector} action
 * @property {CheckResult} check
 * @property {CharacterInfo} source
 * @property {CharacterInfo[]} targets
 * @property {AHItem} item
 * @property {AH_ItemGroup} itemGroup
 * @property {SourceInfo} sourceInfo
 * @remarks Emitted when a check is about to be rendered.
 */

async function renderAction(renderData, config, actor, item) {
  const sourceInfo = SourceInfo.fromInstance(actor, item);
  const check = config.check;
  const source = CharacterInfo.fromActor(actor);

  /** @type RenderActionEvent  **/
  const event = {
    action: config,
    renderData: renderData,
    source: source,
    sourceInfo: sourceInfo,
    targets: CharacterInfo.fromTargetData(config.getTargets()),
    item: item,
    itemGroup: ItemInfo.resolveItemGroup(item),
  };
  return AsyncHooks.callSequential(AH.hooks.RENDER_ACTION_EVENT, event);
}

/**
 * @typedef OpportunityEvent
 * @description Dispatched when a character gets an opportunity
 * @property {ChatMessageSectionCollection} renderData
 * @property {AHActor} actor
 * @property {String} type The type of check that led to the opportunity
 * @property {AHItem} item The item that prompted the check
 * @property {Boolean} fumble If the opportunity came from a fumble, which goes to the opposition of the actor.
 */

function opportunity(renderData, actor, type, item, fumble) {
  /** @type OpportunityEvent  **/
  const event = {
    renderData: renderData,
    actor: actor,
    type: type,
    item: item,
    fumble: fumble,
  };
  Hooks.call(AH.hooks.OPPORTUNITY_EVENT, event);
}

/**
 * @description Dispatched when an actor enters crisis
 * @typedef CrisisEvent
 * @property {AHActor} actor
 * @property {Token} token
 */

/**
 * @description Dispatched when an actor is reduced to 0 HP
 * @typedef DefeatEvent
 * @property {AHActor} actor
 * @property {Token} token
 */

const Events = Object.freeze({
  prepareCheck,

  performAction,
  resolveAction,
  renderAction,
  opportunity,

  calculateDamage,
  applyDamage,
  calculateResource,
  calculateExpense,
  status,

  track,
});

export default Events;
