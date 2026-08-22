#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { parseArgs } from "../lib/args.mjs";
import { pathExists, writeJson } from "../lib/files.mjs";
import { createRunId, resolveWorkspace, studioPath } from "../lib/paths.mjs";

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  console.log("Usage: node scripts/new-edit.mjs [--workspace <path>] --slug <name> [--style <skill>] [--source-mode fresh|stash-selected|stash-recommended]");
  process.exit(0);
}

const workspace = resolveWorkspace(typeof args.workspace === "string" ? args.workspace : process.cwd());
const studio = studioPath(workspace);
if (!(await pathExists(path.join(studio, "studio.json")))) {
  throw new Error(`No initialized studio at ${studio}. Run scripts/init-workspace.mjs first.`);
}

const slug = typeof args.slug === "string" ? args.slug : "untitled-edit";
const style = typeof args.style === "string" ? args.style : "undecided";
const sourceMode = typeof args["source-mode"] === "string" ? args["source-mode"] : "fresh";
if (!["fresh", "stash-selected", "stash-recommended"].includes(sourceMode)) {
  throw new Error("--source-mode must be fresh, stash-selected, or stash-recommended");
}

let runId;
let edit;
for (let attempt = 0; attempt < 5; attempt += 1) {
  runId = createRunId(slug);
  edit = path.join(studio, "edits", runId);
  if (!(await pathExists(edit))) break;
  edit = null;
}
if (!edit) throw new Error("Could not allocate a unique edit run ID");

const directories = ["input", "references", "analysis", "assets", "work", "previews", "exports", "reports"];
await fs.mkdir(edit, { recursive: false });
for (const directory of directories) await fs.mkdir(path.join(edit, directory));

const createdAt = new Date().toISOString();
await writeJson(path.join(edit, "edit.json"), {
  schemaVersion: 1,
  runId,
  createdAt,
  workspace,
  style,
  sourceMode,
  status: "planning",
  selectedExport: null,
  publishConfirmation: null,
}, { exclusive: true });

await writeJson(path.join(edit, "edit-plan.json"), {
  schemaVersion: 1,
  runId,
  format: style === "carousel-maker" ? "carousel" : "video",
  style,
  objective: "",
  audience: "",
  platformTargets: [],
  sourceMode,
  hypothesis: "",
  canvas: style === "carousel-maker"
    ? { width: 1080, height: 1350, unit: "px" }
    : { width: 1080, height: 1920, fps: 30, unit: "px" },
  beats: [],
  text: [],
  audio: { voice: null, music: null, sfx: [] },
  reviewNotes: [],
}, { exclusive: true });

await writeJson(path.join(edit, "asset-ledger.json"), {
  schemaVersion: 1,
  runId,
  assets: [],
}, { exclusive: true });

await fs.writeFile(path.join(edit, "reports", "README.md"), "# Run reports\n\nKeep render metadata, review findings, publishing confirmation, and later performance feedback here.\n", { flag: "wx" });

console.log(edit);
