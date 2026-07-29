import { CharacterInfo, ItemInfo, SourceInfo } from "../data/common/_module.mjs";
import { AsyncHooks, CheckConfigurer, CheckInspector } from "../helpers/_module.mjs";
import AH from "../config.mjs";

/**
 * @typedef CalculateDamageEvent
 * @property {CharacterInfo} source
 * @property {AHItem} item
 * @property {AH_DamageType} type
 * @property {AH_ItemGroup} itemGroup
 * @property {CharacterInfo[]} targets
 * @property {CheckConfigurer} config
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
    type: config.getDamage()?.type,
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
 * @property {CheckConfigurer} config
 */

async function calculateResource(actor, item, config, data) {
  const itemGroup = ItemInfo.resolveItemGroup(item);
  const targets = config.getTargets();
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
 * @typedef InitializeActionEvent
 * @property {CheckConfigurer} config
 * @property {CharacterInfo} source
 * @property {SourceInfo} sourceInfo
 * @property {CharacterInfo[]} targets
 * @property {AH_ItemGroup} itemGroup
 * @property {Object} flags
 * @remarks Emitted when a check is about to be rendered.
 */

async function initializeAction(configuration, actor, item) {
  const sourceInfo = SourceInfo.fromInstance(actor, item);
  const source = CharacterInfo.fromActor(actor);
  /** @type InitializeActionEvent  **/
  const event = {
    config: configuration,
    source: source,
    targets: CharacterInfo.fromTargetData(configuration.getTargets()),
    sourceInfo: sourceInfo,
    itemGroup: ItemInfo.resolveItemGroup(item),
  };
  return AsyncHooks.callSequential(AH.hooks.INITIALIZE_ACTION_EVENT, event);
}

/**
 * @typedef PerformActionEvent
 * @property {Check} check
 * @property {CharacterInfo} source
 * @property {SourceInfo} sourceInfo
 * @property {CharacterInfo[]} targets
 * @property {AHItem} item
 * @property {AH_ItemGroup} itemGroup
 * @property {CheckConfigurer} config
 * @remarks Emitted when a check is about to be performed
 */
async function performAction(check, actor, item) {
  const sourceInfo = SourceInfo.fromInstance(actor, item);
  const source = CharacterInfo.fromActor(actor);
  const config = new CheckConfigurer(check);
  const targetData = config.getTargets();
  let targets = [];
  if (targetData) {
    targets = CharacterInfo.fromTargetData(targetData);
  }
  /** @type PerformActionEvent  **/
  const event = {
    config: config,
    check: check,
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
 * @property {CheckResult} check
 * @property {CharacterInfo} source
 * @property {AHItem} item
 * @property {AH_ItemGroup} itemGroup
 * @property {CharacterInfo[]} targets
 * @property {SourceInfo} sourceInfo
 * @remarks Emitted when a check is about to be performed
 */

function resolveAction(check, actor, item) {
  const sourceInfo = SourceInfo.fromInstance(actor, item);
  const source = CharacterInfo.fromActor(actor);
  const inspector = new CheckInspector(check);
  const targets = inspector.getTargets();

  /** @type ResolveActionEvent  **/
  const event = {
    check: check,
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
 * @property {CheckConfigurer} config
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
    renderData: renderData,
    check: check,
    source: source,
    sourceInfo: sourceInfo,
    config: config,
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

const Events = Object.freeze({
  initializeAction,
  performAction,
  resolveAction,
  renderAction,
  opportunity,

  calculateDamage,
  calculateResource,
});

export default Events;
