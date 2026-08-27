import { promises as fs } from "fs";
import PATH from "path";
import { MarkdownBuilder } from "./markdown-builder.mjs";

const ROOT_DIRECTORY = process.cwd();
const PACKS_DIR_PATH = "./src/packs";
const FOUNDRY_SYSTEM_PATH = "systems/azure-horizon/";

/**
 * Adds custom functions for this file.
 */
class DocBuilder extends MarkdownBuilder {

  /**
   * @param {String} img
   * @returns {String}
   */
  normalizeImagePath(img) {
    if (img.startsWith(FOUNDRY_SYSTEM_PATH)) {
      img = img.replace(FOUNDRY_SYSTEM_PATH, "");
    }
    return img;
  }

  /**
   * @param {String} name
   * @param {String} img
   * @param {String} additional
   * @returns {DocBuilder}
   */
  documentHeader(name, img, additional) {
    let parts = [];
    parts.push("<div class=\"document-header\">");
    parts.push(`<div><img src="${this.normalizeImagePath(img)}"><span>${name}</span></div>`);
    if (additional) {
      parts.push(`<div>${additional}</div>`);
    }
    parts.push("</div>");
    const content = parts.join("\n");
    return this.html(content);
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
      console.log();
      dirs.push({
        ...entry,
        path: path,
      });
    }
  }
  return dirs;
}

/**
 * @typedef {'class'|'skill'|'classFeature'} DocumentType
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
  //console.log(entries);
  for (const entry of entries) {
    if (entry.name.startsWith(type)) {
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

/**
 * @typedef ClassEntry
 * @property {FileSystemEntry} file
 * @property {FileSystemEntry[]} skills
 * @property {FileSystemEntry[]} features
 */

// 1. CLASS FILES

/** @type ClassEntry[] **/
let classes = [];
const CLASSES_DIR_PATH = PATH.join(PACKS_DIR_PATH, "classes");
const CLASS_DIRECTORIES = await getDirectories(CLASSES_DIR_PATH);
for (const classDir of CLASS_DIRECTORIES) {
  const _classes = await getDocuments(classDir, "class");
  //console.log(`Parsed classes ${ _classes.length}`);
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

const OUTPUT_CLASSES_DIRECTORY = PATH.join(ROOT_DIRECTORY, "docs", "_classes");
await cleanDirectory(OUTPUT_CLASSES_DIRECTORY);

for (const entry of classes) {
  //console.log(`Parsed class ${entry.file.name} with skills: ${entry.skills.map(s => s.name).join(", ")}`);
  const classDocument = await deserializeDocument(entry.file);
  const entryFileName = PATH.join(OUTPUT_CLASSES_DIRECTORY, `${classDocument.name}.md`);

  let md = new DocBuilder();
  md.frontMatter({ title: classDocument.name });
  md.heading(1, classDocument.name);
  md.p(classDocument.system.description);
  md.hr();
  md.heading(2, "Skills");
  for (const skill of entry.skills) {
    const skillDocument = await deserializeDocument(skill);
    md.documentHeader(skillDocument.name, skillDocument.img, `SL ${skillDocument.system.level.max}`);
    md.p(skillDocument.system.description);
  }

  const content = md.build();

  await fs.writeFile(entryFileName, content);
  console.log(`Writing file to ${entryFileName}`);
}
