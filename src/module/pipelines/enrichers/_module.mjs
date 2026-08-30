import DamageTextEditorEnricher from "./damage-text-editor-enricher.mjs";
import ResourceTextEditorEnricher from "./resource-text-editor-enricher.mjs";
import { EffectTextEditorEnricher } from "./effect-text-editor-enricher.mjs";
import CheckTextEditorEnricher from "./check-text-editor-enricher.mjs";

/**
 * @type {Record<String, AH_TextEditorEnrichment >}
 */
const implementations = Object.freeze({
  damage: DamageTextEditorEnricher,
  resource: ResourceTextEditorEnricher,
  effect: EffectTextEditorEnricher,
  check: CheckTextEditorEnricher,
});

export { implementations };
