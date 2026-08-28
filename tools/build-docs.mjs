import { promises as fs } from "fs";
import PATH from "path";
import { MarkdownBuilder } from "./markdown-builder.mjs";

const ROOT_DIRECTORY = process.cwd();
const DOCS_DIRECTORY = PATH.join(ROOT_DIRECTORY, "docs");
const ASSETS_DIRECTORY = "/assets";
const PACKS_DIR_PATH = "./src/packs";
const FOUNDRY_SYSTEM_PATH = "systems/azure-horizon/";

/**
 * @param {String|*} input
 * @returns {String}
 */
function capitalize(input) {
  return typeof input === "string" ? input.charAt(0).toUpperCase() + input.slice(1).toLowerCase() : input;
}

/**
 * Adds custom functions for this file.
 */
class DocBuilder extends MarkdownBuilder {

  static NEWLINE = "\n";

  /**
   * @param {String[]} parts
   * @param {String[]} traits
   * @param {String} classes
   */
  constructTraitsElements(parts, traits, classes) {
    if (traits.length === 0) {
      return;
    }
    parts.push(`<div class="document-traits ${classes}">`);
    for (const trait of traits) {
      parts.push(`<span class="document-trait">${capitalize(trait)}</span>`);
    }
    parts.push("</div>");
  }

  /**
   * @param {String[]} traits
   * @param classes
   */
  traits(traits, classes = "") {
    let parts = [];
    this.constructTraitsElements(parts, traits, classes);
    const content = parts.join(DocBuilder.NEWLINE);
    return this.html(content);
  }

  /**
   * @typedef DocumentHeaderOptions
   * @property {String[]} traits
   * @property {String} additional
   */

  /**
   * @param {String} name
   * @param {String} img
   * @param {DocumentHeaderOptions} options
   * @returns {DocBuilder}
   */
  documentHeader(name, img, options) {
    let parts = [];
    parts.push("<div class=\"document-header\">");
    parts.push(`<div class="document-header__name"><img src="${this.#normalizeImagePath(img)}"><span>${name}</span></div>`);

    parts.push("<div class='document-header__properties'>");
    if (options.traits) {
      this.constructTraitsElements(parts, options.traits, "--nested");
    }
    if (options.additional) {
      parts.push(options.additional);
    }
    parts.push("</div>");

    parts.push("</div>");
    const content = parts.join(DocBuilder.NEWLINE);
    return this.html(content);
  }

  /**
   * @param {String} img
   * @returns {String}
   */
  #normalizeImagePath(img) {
    if (img.startsWith(FOUNDRY_SYSTEM_PATH)) {
      img = img.replace(FOUNDRY_SYSTEM_PATH, "{{ site.baseurl }}/");
    }
    return img;
  }
}

/**
 * @typedef FileSystemEntry
 * @property {String} name
 * @property {String} parentPath
 * @property {string} path
 */

/**
 * @param path
 * @returns {Promise<FileSystemEntry[]>}
 */
async function getDirectories(path) {
  let dirs = [];
  const entries = await fs.readdir(path, {
    withFileTypes: true, withFileExtensions: true, withExtensions: true,
  });
  for (const entry of entries) {
    const path = PATH.join(entry.parentPath, entry.name);
    if (entry.isDirectory()) {
      dirs.push({
        ...entry,
        path: path,
      });
    }
  }
  return dirs;
}

/**
 * @typedef {'class'|'skill'|'classFeature'|'spell'|'JournalEntry'} DocumentType
 */

/**
 * @param {FileSystemEntry} entry
 * @param {DocumentType} type The document type
 * @returns {Promise<FileSystemEntry[]>}
 */
async function getDocuments(entry, type) {
  let documents = [];
  const entries = await fs.readdir(entry.path, {
    withFileTypes: true, withFileExtensions: true, withExtensions: true,
  });
  for (const entry of entries) {
    if (entry.name.startsWith(`${type}_`)) {
      documents.push({
        ...entry,
        path: PATH.join(entry.parentPath, entry.name),
      });
    }
  }
  return documents;
}

/**
 * @typedef DocumentEntry
 * @property {String} name
 * @property {DocumentType} type
 * @property {String} img
 * @property {Object} system
 * @property {String} system.description
 */

/**
 * @param {FileSystemEntry} entry
 * @returns {Promise<DocumentEntry>}
 */
async function deserializeDocument(entry) {
  let data = await fs.readFile(entry.path, "utf-8", (err, data) => {
    if (err) {
      throw err;
    }
  });
  return JSON.parse(data.toString());
}

/**
 * @param {String} directoryPath
 * @returns {Promise<void>}
 */
async function cleanDirectory(directoryPath) {
  await fs.rm(directoryPath, {
    force: true,
    recursive: true,
  });
  await fs.mkdir(directoryPath);
}

const FILE_EXTENSION = "md";

///////////////////////////////////////////////////////////////////////////////
// CLASSES
///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef ClassDocumentCollection
 * @property {FileSystemEntry} file
 * @property {FileSystemEntry[]} skills
 * @property {FileSystemEntry[]} features
 */

/** @type ClassDocumentCollection[] **/
let classes = [];

const SRC_CLASSES_DIR_PATH = PATH.join(PACKS_DIR_PATH, "classes");
const SRC_CLASS_DIRECTORIES = await getDirectories(SRC_CLASSES_DIR_PATH);
for (const classDir of SRC_CLASS_DIRECTORIES) {
  const _classes = await getDocuments(classDir, "class");
  const skills = await getDocuments(classDir, "skill");
  let features = [];
  const featureDirs = await getDirectories(classDir.path);
  for (const featureDir of featureDirs) {
    const featureFiles = await getDocuments(featureDir, "classFeature");
    features.push(...featureFiles);
  }
  classes.push({
    file: _classes[0],
    skills: skills,
    features: features,
  });
}

const DST_CLASSES_DIR_PATH = PATH.join(ROOT_DIRECTORY, "docs", "_classes");
await cleanDirectory(DST_CLASSES_DIR_PATH);

function getFeatureTraits(entry) {
  let traits = [];
  if (entry.system.action?.traits) {
    traits.push(...entry.system.action.traits);
  }
  if (entry.system.action?.type) {
    if (entry.system.action.type === "action") {
      traits.push(`Action ${entry.system.action.points}`);
    }
    else {
      traits.push(entry.system.action.type);
    }
  }
  return traits;
}

for (const entry of classes) {
  const classDocument = await deserializeDocument(entry.file);
  const entryFileName = PATH.join(DST_CLASSES_DIR_PATH, `${classDocument.name}.${FILE_EXTENSION}`);
  const className = classDocument.name.toLowerCase();

  let md = new DocBuilder();
  md.frontMatter({ title: classDocument.name, img: `${ASSETS_DIRECTORY}/icons/classes/${className}/${className}.png` });
  if (classDocument.system.traits) {
    md.traits(classDocument.system.traits, "--center");
  }
  md.p(classDocument.system.description);

  // Triggers
  if (classDocument.system.triggers?.length > 0) {
    md.hr();
    md.heading(3, "Experience Triggers");
    md.list(classDocument.system.triggers);
  }
  // Complications
  if (classDocument.system.complications?.length > 0) {
    md.hr();
    md.heading(3, "Complications");
    md.list(classDocument.system.complications);
  }

  // Skills
  md.hr();
  md.customHeading(1, "Skills", "class__skills");
  for (const skillEntry of entry.skills) {
    const skill = await deserializeDocument(skillEntry);

    // Gather traits among all fields
    const traits = getFeatureTraits(skill);
    md.documentHeader(skill.name, skill.img, {
      traits: traits,
      additional: `<i class="fa-solid fa-star"></i> ${skill.system.level.max}`,
    });

    md.p(skill.system.description);
  }
  // Features
  if (entry.features.length > 0) {
    md.hr();
    md.heading(2, "Features");
    for (const featureEntry of entry.features) {
      const feature = await deserializeDocument(featureEntry);
      const traits = getFeatureTraits(feature);
      md.documentHeader(feature.name, feature.img, {
        traits: traits,
      });
      md.p(feature.system.description);
    }
  }

  const content = md.build();

  await fs.writeFile(entryFileName, content);
  console.log(`Writing class file to ${entryFileName}`);
}

///////////////////////////////////////////////////////////////////////////////
// SPELLS
///////////////////////////////////////////////////////////////////////////////
const SRC_SPELL_DIR = PATH.join(PACKS_DIR_PATH, "spells");
const SRC_SPELL_DIRECTORIES = await getDirectories(SRC_SPELL_DIR);

/**
 * @typedef {DocumentEntry} SpellEntry
 * @property {String} system.domain
 */

const UNTYPED_DOMAIN = "general";

/** @type {Map<String, SpellEntry[]>} **/
let spellsByDomain = new Map();

for (const dir of SRC_SPELL_DIRECTORIES) {
  const spellEntries = await getDocuments(dir, "spell");
  for (const entry of spellEntries) {
    /** @type SpellEntry **/
    const spell = await deserializeDocument(entry);
    let domain = spell.system.domain;
    if (!domain) {
      domain = UNTYPED_DOMAIN;
    }
    if (!spellsByDomain.has(domain)) {
      spellsByDomain.set(domain, []);
    }
    const sd = spellsByDomain.get(domain);
    sd.push(spell);
    spellsByDomain.set(domain, sd);
  }
}

// Now write the domain files
const DST_SPELL_DIR = PATH.join(ROOT_DIRECTORY, "docs", "_spells");
await cleanDirectory(DST_SPELL_DIR);
for (const [domain, spells] of spellsByDomain) {
  const fileName = PATH.join(DST_SPELL_DIR, `${capitalize(domain)}.${FILE_EXTENSION}`);
  let md = new DocBuilder();
  md.frontMatter({ title: capitalize(domain), img: `${ASSETS_DIRECTORY}/icons/spells/${domain}.png` });
  for (const spell of spells) {
    let traits = [];
    traits.push(spell.system.speed);
    md.documentHeader(spell.name, spell.img, {
      traits: traits,
    });
    md.p(spell.system.description);
  }
  const content = md.build();
  await fs.writeFile(fileName, content);
  console.log(`Writing spell file to ${fileName}`);
}

///////////////////////////////////////////////////////////////////////////////
// JOURNALS
///////////////////////////////////////////////////////////////////////////////
const SRC_JOURNAL_DIR = PATH.join(PACKS_DIR_PATH, "journals");
const JOURNAL_DIR_ENTRY = {
  name: "journals",
  parentPath: PACKS_DIR_PATH,
  path: SRC_JOURNAL_DIR,
};
const SRC_JOURNAL_DOCUMENTS = await getDocuments(JOURNAL_DIR_ENTRY, "JournalEntry");

/**
 * @typedef JournalEntry
 * @property {String} name
 * @property {JournalEntryPage[]} pages
 */

/**
 * @typedef JournalEntryPage
 * @property {String} name
 * @property {String} text.content
 */

/** @type {Map<String, JournalEntry>} **/
const journals = new Map();
for (const entry of SRC_JOURNAL_DOCUMENTS) {
  const doc = await deserializeDocument(entry);
  journals.set(doc.name, doc);
}

// GLOSSARY
const glossary = journals.get("Glossary");
if (glossary) {
  const fileName = PATH.join(DOCS_DIRECTORY, `glossary.${FILE_EXTENSION}`);
  let md = new DocBuilder();
  md.frontMatter({ title: glossary.name });
  for (const page of glossary.pages) {
    md.h1(page.name);
    md.p(page.text.content);
  }
  const content = md.build();
  await fs.writeFile(fileName, content);
  console.log(`Writing glossary file to ${fileName}`);
}

// MANUAL
const DST_MANUAL_DIR = PATH.join(ROOT_DIRECTORY, "docs", "_manual");
await cleanDirectory(DST_MANUAL_DIR);
const IGNORED_MANUAL_PAGES = new Set(["Foreword"]);
const manual = journals.get("Manual");
if (manual) {
  const pagesByName = new Map(manual.pages.map(p => [p.name, p.text]));

  // Add foreword
  const foreword = pagesByName.get("Foreword");
  if (foreword) {

  }

  // Add rest of pages
  for (const page of manual.pages) {
    if (IGNORED_MANUAL_PAGES.has(page.name)) {
      continue;
    }
    const fileName = PATH.join(DST_MANUAL_DIR, `${page.name}.${FILE_EXTENSION}`);
    let md = new DocBuilder();
    md.frontMatter({ title: page.name });
    md.html(page.text.content);
    const content = md.build();
    await fs.writeFile(fileName, content);
    console.log(`Writing manual file to ${fileName}`);
  }
}
