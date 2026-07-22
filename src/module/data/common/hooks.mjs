import { systemNS } from "../../constants.mjs";

const Hooks = Object.freeze({

  PREPARE_CHECK: `${systemNS}.check.prepare`,

  PROCESS_CHECK: `${systemNS}.check.process`,

  RENDER_CHECK: `${systemNS}.check.render`,

  /**
   * @description Dispatched when a check is being initialized.
   * @example callback(event)
   * @remarks Uses {@link InitializeActionEvent}
   */
  INITIALIZE_ACTION_EVENT: `${systemNS}.events.actions.initialize`,
  /**
   * @description Dispatched when a check is about to be performed.
   * @example callback(event)
   * @remarks Uses {@link PerformActionEvent}
   */
  PERFORM_ACTION_EVENT: `${systemNS}.events.actions.perform`,
  /**
   * @description Dispatched when a check has been resolved.
   * @example callback(event)
   * @remarks Uses {@link ResolveActionEvent}
   */
  RESOLVE_ACTION_EVENT: `${systemNS}.events.actions.resolve`,
  /**
   * @description Dispatched when a check is about to be rendered.
   * @example callback(event)
   * @remarks Uses {@link RenderActionEvent}
   */
  RENDER_ACTION_EVENT: `${systemNS}.events.actions.render`,

  /**
   * @description Dispatched after a character gains an opportunity
   * @example callback(event)
   * @remarks Uses {@link OpportunityEvent}
   */
  OPPORTUNITY_EVENT: `${systemNS}.events.opportunity`,

});

export default Hooks;
