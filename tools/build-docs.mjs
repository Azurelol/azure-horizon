import { promises as fs } from "fs";
import PATH from "path";
import { MarkdownDocument } from "build-md";

const ROOT_DIRECTORY = process.cwd();
const PACKS_DIR_PATH = "./src/packs";

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

const OUTPUT_CLASSES_DIRECTORY = PATH.join(ROOT_DIRECTORY, "docs", "classes");
await cleanDirectory(OUTPUT_CLASSES_DIRECTORY);

for (const entry of classes) {
  //console.log(`Parsed class ${entry.file.name} with skills: ${entry.skills.map(s => s.name).join(", ")}`);
  const classDocument = await deserializeDocument(entry.file);
  const entryFileName = PATH.join(OUTPUT_CLASSES_DIRECTORY, `${classDocument.name}.md`);

  let md = new MarkdownDocument({ mutable: true });
  md.heading(1, classDocument.name);
  md.paragraph(classDocument.system.description);
  const content = md.toString();

  await fs.writeFile(entryFileName, content);
  console.log(`Writing file to ${entryFileName}`);
}
