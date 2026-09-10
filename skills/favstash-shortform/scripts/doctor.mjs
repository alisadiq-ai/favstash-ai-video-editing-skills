#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import { parseArgs } from "../lib/args.mjs";
import { pathExists } from "../lib/files.mjs";
import { studioPath } from "../lib/paths.mjs";
import { commandStatus } from "../lib/process.mjs";

const args = parseArgs(process.argv.slice(2));
const workspace = path.resolve(typeof args.workspace === "string" ? args.workspace : process.cwd());
const runtime = path.join(studioPath(workspace), "runtime");
const hyperframesBinary = path.join(runtime, "node_modules", ".bin", "hyperframes");
const hyperframesInstalled = await pathExists(hyperframesBinary);
const hyperframesStatus = hyperframesInstalled ? commandStatus(hyperframesBinary, ["--version"], { timeout: 20_000 }) : null;

const nodeMajor = Number(process.versions.node.split(".")[0]);
const checks = {
  node: {
    available: nodeMajor >= 22,
    version: process.versions.node,
    required: ">=22",
  },
  npm: commandStatus("npm", ["--version"]),
  ffmpeg: commandStatus("ffmpeg", ["-version"]),
  ffprobe: commandStatus("ffprobe", ["-version"]),
  ytDlp: commandStatus("yt-dlp", ["--version"]),
  hyperframes: {
    available: Boolean(hyperframesStatus?.available),
    version: hyperframesStatus?.version ?? null,
    expected: "0.8.10",
    location: hyperframesBinary,
    error: hyperframesStatus?.error ?? null,
  },
};

const report = {
  schemaVersion: 1,
  workspace,
  studioInitialized: await pathExists(studioPath(workspace)),
  coreReady: checks.node.available && checks.npm.available && checks.ffmpeg.available && checks.ffprobe.available,
  referenceAnalysisReady: checks.ytDlp.available,
  renderReady: checks.node.available && checks.ffmpeg.available && checks.ffprobe.available && checks.hyperframes.available,
  checks,
  guidance: [
    !checks.node.available && "Install Node.js 22 or newer.",
    (!checks.ffmpeg.available || !checks.ffprobe.available) && "Install an FFmpeg build that includes ffprobe.",
    !checks.ytDlp.available && "Install yt-dlp before URL-based reference analysis (for example: brew install yt-dlp or follow the official installer).",
    !checks.hyperframes.available && "If this edit needs HyperFrames, run: node <skill>/scripts/init-workspace.mjs --workspace <path> --install",
  ].filter(Boolean),
};

if (args.json) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  const icon = (ready) => ready ? "✓" : "✗";
  console.log("FavStash optional media tools");
  console.log(`Workspace: ${workspace}`);
  console.log(`${icon(checks.node.available)} Node ${checks.node.version} (requires ${checks.node.required})`);
  console.log(`${icon(checks.npm.available)} npm${checks.npm.version ? ` ${checks.npm.version}` : ""}`);
  console.log(`${icon(checks.ffmpeg.available)} FFmpeg`);
  console.log(`${icon(checks.ffprobe.available)} FFprobe`);
  console.log(`${icon(checks.ytDlp.available)} yt-dlp — required for URL reference analysis`);
  console.log(`${icon(checks.hyperframes.available)} HyperFrames ${checks.hyperframes.version ?? checks.hyperframes.expected} workspace runtime`);
  if (report.guidance.length) {
    console.log("\nNext steps:");
    for (const item of report.guidance) console.log(`- ${item}`);
  }
}

if (args.strict && !report.renderReady) process.exitCode = 1;
