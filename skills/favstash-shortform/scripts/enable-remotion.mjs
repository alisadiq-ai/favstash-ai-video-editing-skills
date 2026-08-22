#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "../lib/args.mjs";
import { pathExists, readJson, writeJson } from "../lib/files.mjs";
import { resolveWorkspace, studioPath } from "../lib/paths.mjs";
import { run } from "../lib/process.mjs";

const REMOTION_VERSION = "4.0.515";
const REACT_VERSION = "19.2.8";
const args = parseArgs(process.argv.slice(2));
const workspace = resolveWorkspace(typeof args.workspace === "string" ? args.workspace : process.cwd());
const runtime = path.join(studioPath(workspace), "runtime");
const packagePath = path.join(runtime, "package.json");

if (!args["acknowledge-license"]) {
  console.error("Remotion uses a special license. Individuals, eligible small organizations, and non-profits may qualify for free use; other for-profit organizations need a company license.");
  console.error("Read the current terms: https://github.com/remotion-dev/remotion/blob/main/LICENSE.md");
  console.error("Re-run with --acknowledge-license only after the user has reviewed their eligibility.");
  process.exit(2);
}
if (!(await pathExists(packagePath))) throw new Error("Initialize the FavStash studio before enabling Remotion");

const runtimePackage = await readJson(packagePath);
runtimePackage.dependencies ||= {};
Object.assign(runtimePackage.dependencies, {
  "@remotion/cli": REMOTION_VERSION,
  remotion: REMOTION_VERSION,
  react: REACT_VERSION,
  "react-dom": REACT_VERSION,
});
await writeJson(packagePath, runtimePackage);
await writeJson(path.join(runtime, "remotion-license-acknowledgment.json"), {
  acknowledgedAt: new Date().toISOString(),
  upstreamLicense: "https://github.com/remotion-dev/remotion/blob/main/LICENSE.md",
  configuredVersion: REMOTION_VERSION,
  note: "This records user acknowledgment, not a legal eligibility determination or license key.",
});

if (!args["no-install"]) await run("npm", ["install", "--no-audit", "--no-fund"], { cwd: runtime });
console.log(`Remotion ${REMOTION_VERSION} configured in ${runtime}`);
