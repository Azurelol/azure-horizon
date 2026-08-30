import { systemID } from "../../constants.mjs";
import { HTMLUtils, StringUtils, TextEditorUtils } from "../../utils/_module.mjs";
import AH from "../../config.mjs";
import Targeting from "../../helpers/targeting.mjs";
import { EvaluationContext, SourceInfo } from "../../data/common/_module.mjs";
import Flags from "../../data/common/flags.mjs";
import { Formulas } from "../../ruleset/_module.mjs";
import Tracks from "../tracks.mjs";

const ID = "CheckTextEditorEnricher";

/**
 * @typedef {DOMStringMap} InlineCheckDataset
 * @inheritDoc
 * @property {CheckType} type
 * @property first
 * @property second
 * @property modifier
 * @property label
 * @property difficulty
 * @property document
 * @property propertyPath
 * @property index
 * @property increment
 */

/** *
 * @param {Number} value
 * @returns {AH_DifficultyLevel}
 */
function fromValue(value) {
  if (value >= AH.difficultyLevel.impossible.value) {
    return AH.difficultyLevel.veryHard.key;
  } else if (value >= AH.difficultyLevel.hard.value) {
    return AH.difficultyLevel.hard.key;
  } else if (value >= AH.difficultyLevel.normal.value) {
    return AH.difficultyLevel.normal.key;
  }
  return AH.difficultyLevel.easy.key;
}

/**
 * @param {AH_DifficultyLevel} level
 * @param {HTMLElement} anchor
 * @param {Boolean} show
 */
function appendDifficulty(level, anchor, show) {
  if (level in AH.difficultyLevel) {
    anchor.dataset.level = level;
    anchor.dataset.difficulty = AH.difficultyLevel[level].value;
  }
  else {
    let value = parseInt(level);
    if (typeof value === "number") {
      anchor.dataset.difficulty = value;
      anchor.dataset.level = fromValue(value);
    }
  }

  if (show) {
    TextEditorUtils.connector(anchor, "right");

    const difficultyText = document.createElement("i");
    difficultyText.classList.add("difficulty");
    difficultyText.append(`${anchor.dataset.difficulty}`);
    anchor.append(difficultyText);
  }
}

/**
 * @param {RegExpMatchArray} match The text within a chat message that matches the given pattern
 * @param {*} options
 * @returns A formatted html element
 */
function enricher(match, options) {
  let first = match[1];
  let second = match[2];
  const label = match.groups.label;
  const type = match.groups.type ?? AH.defaults.check.type;

  if ((first in AH.attributes) && (second in AH.attributes)) {
    const anchor = TextEditorUtils.anchor();
    anchor.dataset.first = first;
    anchor.dataset.second = second;
    anchor.dataset.type = type;

    let tooltip = StringUtils.localize("AH.CHAT.RollCheck");

    // ICON
    TextEditorUtils.icon(anchor, type);

    if (label) {
      anchor.append(label);
      anchor.dataset.label = label;
    }
    // [OPTIONAL] Modifier
    let modifier = (match.groups.modifier ?? "").slice(1, -1);
    if (modifier) {
      if (label) {
        anchor.dataset.modifier = modifier;
      } else {
        const modifierConnector = document.createElement("i");
        modifierConnector.classList.add("connector", "fa-plus");
        modifierConnector.textContent = " ";
        anchor.append(modifierConnector);
        TextEditorUtils.variable(anchor, "modifier", modifier, "MOD");
      }
      tooltip += ` Modifier: (${modifier})`;
    } else {
      anchor.dataset.modifier = 0;
    }
    // [OPTIONAL] DIFFICULTY
    let level = match.groups.level;
    if (level !== undefined) {
      appendDifficulty(level, anchor, label === undefined);
    }
    anchor.setAttribute("data-tooltip", tooltip);
    // [OPTIONAL] Document, PropertyPath, Index, Increment
    anchor.dataset.document = match.groups.document;
    anchor.dataset.propertyPath = match.groups.propertyPath;
    anchor.dataset.index = match.groups.index;
    anchor.dataset.increment = match.groups.increment;
    // Show attributes
    const span = document.createElement("span");
    TextEditorUtils.icon(span, first);
    TextEditorUtils.icon(span, second);
    anchor.append(span);
    return anchor;
  }
  return null;
}

/**
 * @param {HTMLElement} element
 * @returns {Promise<void>}
 */
async function onRender(element) {
  const renderContext = await TextEditorUtils.getRenderContext(element);
  element.addEventListener("click", async function(event) {
    /** @type InlineCheckDataset **/
    const dataset = renderContext.dataset;
    const targets = await getSelection();

    if (targets.length === 0) return;
    const first = dataset.first;
    const second = dataset.second;
    const difficulty = dataset.difficulty;

    let type = dataset.type;
    const prompt = event.shiftKey;
    const attributes = { primary: first, secondary: second };
    const item = renderContext.sourceInfo.resolveItem();

    /** @type CheckResultCallback **/
    const onResult = async (check) => {
      if (difficulty && dataset.document) {
        const result = check.result;
        if (result.fumble || (result < difficulty)) {
          return;
        }

        let increment = Formulas.calculateTrackChange(result, difficulty, result.critical);
        if (dataset.increment === "false") {
          increment = -increment;
        }

        const document = await fromUuid(dataset.document);
        if (dataset.index) {
          await Tracks.updateAtIndexForDocument(document, dataset.propertyPath, dataset.index, increment, {
            source: targets[0],
          });
        }
      }
    };

    for (const actor of targets) {

    }

  });

  // Handle dragstart
  element.addEventListener("dragstart", async function (event) {
    const sourceInfo = SourceInfo.resolve(document, renderContext.target);
    const data = {
      type: ID,
      _sourceInfo: sourceInfo,
      traits: renderContext.dataset.traits,
    };

    event.dataTransfer.setData("text/plain", JSON.stringify(data));
    event.stopPropagation();
  });
}

/**
 * @type TextEditorEnricherConfig
 */
const config = {
  id: ID,
  pattern: TextEditorUtils.pattern("CHECK",
    "\\s*(?<first>\\w+)\\s*(?<second>\\w+)\\s*(?<modifier>\\(.*?\\))*\\s*(?<level>\\w+)?",
    TextEditorUtils.documentPatternGroup.concat(TextEditorUtils.propertyPattern("increment", "increment", "(true|false)", true), TextEditorUtils.propertyPattern("type", "t", "\\w+"))),
  enricher,
  onRender,
};

async function onDropActor(actor, sheet, { type, damageType, amount, _sourceInfo, traits, ignore }) {
  if (type === ID) {
    // Need to rebuild the class after it was deserialized
    const sourceInfo = SourceInfo.fromObject(_sourceInfo);
    const context = EvaluationContext.fromSourceInfo(sourceInfo, [actor]);

    // TODO: Check?

    return false;
  }
}

/**
 * @type {AH_TextEditorEnrichment}
 */
const CheckTextEditorEnricher = Object.freeze({
  enrichers: [config],
  onDropActor,
});

export default CheckTextEditorEnricher;
