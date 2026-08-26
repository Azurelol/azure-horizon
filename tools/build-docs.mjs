import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { promises as fs } from "fs";
import path from "path";

const SYSTEM_ID = process.cwd();
const yaml = false;
const folders = true;

const packs = await fs.readdir("./src/packs");
for (const pack of packs) {
  if (pack.startsWith(".")) continue;
  console.log("Building docs for " + pack);
  await compilePack(
    `${SYSTEM_ID}/src/packs/${pack}`,
    `${SYSTEM_ID}/packs/${pack}`,
    { yaml, recursive: folders, transformEntry },
  );
}
