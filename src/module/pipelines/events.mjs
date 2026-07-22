import { CharacterInfo, Hooks, ItemInfo, SourceInfo } from "../data/common/_module.mjs";
import { AsyncHooks, CheckConfigurer, CheckInspector } from "../helpers/_module.mjs";

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
  return AsyncHooks.callSequential(Hooks.INITIALIZE_ACTION_EVENT, event);
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
  return AsyncHooks.callSequential(Hooks.PERFORM_ACTION_EVENT, event);
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
  Hooks.call(Hooks.RESOLVE_ACTION_EVENT, event);
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
  return AsyncHooks.callSequential(Hooks.RENDER_ACTION_EVENT, event);
}

const Events = Object.freeze({
  initializeAction,
  performAction,
  resolveAction,
  renderAction,
});

export default Events;
