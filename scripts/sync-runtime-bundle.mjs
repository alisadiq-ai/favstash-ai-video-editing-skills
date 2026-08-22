#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { listFilesRecursively, sha256File, writeJson } from "../lib/files.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const destination = path.join(root, "skills", "favstash-shortform");
const scriptNames = [
  "doctor.mjs",
  "init-workspace.mjs",
  "new-edit.mjs",
  "index-broll.mjs",
  "reference-analyze.mjs",
  "enable-remotion.mjs",
];

async function copyTree(source, target) {
  await fs.mkdir(target, { recursive: true });
  for (const file of await listFilesRecursively(source)) {
    const relative = path.relative(source, file);
    const output = path.join(target, relative);
    await fs.mkdir(path.dirname(output), { recursive: true });
    await fs.copyFile(file, output);
  }
}

await copyTree(path.join(root, "lib"), path.join(destination, "lib"));
await copyTree(path.join(root, "schemas"), path.join(destination, "schemas"));
await fs.mkdir(path.join(destination, "scripts"), { recursive: true });
for (const name of scriptNames) {
  await fs.copyFile(path.join(root, "scripts", name), path.join(destination, "scripts", name));
}

const bundledFiles = [
  ...(await listFilesRecursively(path.join(destination, "lib"))),
  ...(await listFilesRecursively(path.join(destination, "schemas"))),
  ...scriptNames.map((name) => path.join(destination, "scripts", name)),
].sort();
const entries = [];
for (const file of bundledFiles) {
  entries.push({
    path: path.relative(destination, file),
    sha256: await sha256File(file),
  });
}
const aggregate = crypto.createHash("sha256");
for (const entry of entries) aggregate.update(`${entry.path}\0${entry.sha256}\n`);
await writeJson(path.join(destination, "runtime-manifest.json"), {
  schemaVersion: 1,
  generatedBy: "scripts/sync-runtime-bundle.mjs",
  purpose: "Operational files bundled inside the core skill so skills-CLI installs remain self-contained.",
  aggregateSha256: aggregate.digest("hex"),
  files: entries,
});
console.log(`Bundled ${entries.length} runtime files into skills/favstash-shortform`);
