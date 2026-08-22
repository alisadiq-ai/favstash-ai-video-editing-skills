#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { parseArgs } from "../lib/args.mjs";
import { copyIfMissing, pathExists, readJson, writeJson } from "../lib/files.mjs";
import { resolveWorkspace, studioPath } from "../lib/paths.mjs";
import { run } from "../lib/process.mjs";

const HYPERFRAMES_VERSION = "0.8.10";
const scriptParent = fileURLToPath(new URL("..", import.meta.url));
const args = parseArgs(process.argv.slice(2));

if (args.help) {
  console.log("Usage: node scripts/init-workspace.mjs [--workspace <path>] [--install]");
  process.exit(0);
}

const workspace = resolveWorkspace(typeof args.workspace === "string" ? args.workspace : process.cwd());
const studio = studioPath(workspace);
const directories = [
  "assets",
  "broll",
  "edits",
  "fonts",
  "logos",
  "runtime",
  "styles",
];

await fs.mkdir(workspace, { recursive: true });
for (const directory of directories) await fs.mkdir(path.join(studio, directory), { recursive: true });

const repositoryPreferences = path.join(scriptParent, "skills", "favstash-shortform", "assets", "preferences.template.md");
const bundledPreferences = path.join(scriptParent, "assets", "preferences.template.md");
const preferencesSource = await pathExists(bundledPreferences) ? bundledPreferences : repositoryPreferences;
const preferencesTarget = path.join(studio, "preferences.md");
await copyIfMissing(preferencesSource, preferencesTarget);

const packageTarget = path.join(studio, "runtime", "package.json");
let runtimePackage = {
  name: "favstash-studio-runtime",
  version: "0.1.0",
  private: true,
  type: "module",
  engines: { node: ">=22" },
  dependencies: { hyperframes: HYPERFRAMES_VERSION },
};
if (await pathExists(packageTarget)) {
  runtimePackage = await readJson(packageTarget);
  runtimePackage.private = true;
  runtimePackage.type ||= "module";
  runtimePackage.engines ||= { node: ">=22" };
  runtimePackage.dependencies ||= {};
}
runtimePackage.dependencies.hyperframes = HYPERFRAMES_VERSION;
await writeJson(packageTarget, runtimePackage);

const studioManifest = path.join(studio, "studio.json");
if (!(await pathExists(studioManifest))) {
  await writeJson(studioManifest, {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    renderer: "hyperframes",
    rendererVersion: HYPERFRAMES_VERSION,
    editDirectoryPattern: "YYYY-MM-DD-HHMMSS-<slug>-<short-id>",
    favstashConnection: "unknown",
  }, { exclusive: true });
}

const repositorySfx = path.join(scriptParent, "skills", "shortform-sound-design", "assets", "sfx");
const installedSiblingSfx = path.join(scriptParent, "..", "shortform-sound-design", "assets", "sfx");
const sfxSource = await pathExists(installedSiblingSfx) ? installedSiblingSfx : repositorySfx;
const sfxTarget = path.join(studio, "assets", "favstash-sfx-starter");
if (await pathExists(sfxSource) && !(await pathExists(sfxTarget))) {
  await fs.cp(sfxSource, sfxTarget, { recursive: true, errorOnExist: true, force: false });
}

if (args.install) {
  console.log(`Installing HyperFrames ${HYPERFRAMES_VERSION} in ${path.join(studio, "runtime")}`);
  await run("npm", ["install", "--no-audit", "--no-fund"], { cwd: path.join(studio, "runtime") });
}

console.log(`Studio ready: ${studio}`);
console.log(`Preferences: ${preferencesTarget}`);
console.log(`B-roll inbox: ${path.join(studio, "broll")}`);
if (!args.install) console.log("HyperFrames is configured but not installed. Re-run with --install before rendering.");
console.log("Reference-led editing also requires yt-dlp; verify it with npm run doctor.");
