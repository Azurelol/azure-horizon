import DamageTextEditorEnricher from "./damage-text-editor-enricher.mjs";
import ResourceTextEditorEnricher from "./resource-text-editor-enricher.mjs";

/**
 * @type {Record<String, AH_TextEditorEnrichment >}
 */
const implementations = Object.freeze({
  damage: DamageTextEditorEnricher,
  resource: ResourceTextEditorEnricher,
});

export { implementations };
