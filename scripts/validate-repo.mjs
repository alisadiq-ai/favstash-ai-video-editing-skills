#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { listFilesRecursively, pathExists, readJson, sha256File } from "../lib/files.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
const checks = [];

function pass(message) {
  checks.push(message);
}

function fail(message) {
  failures.push(message);
}

const requiredRoot = [
  ".gitignore",
  "AGENTS.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "LICENSE",
  "README.md",
  "SECURITY.md",
  "THIRD_PARTY_NOTICES.md",
  "package.json",
];
for (const relative of requiredRoot) {
  if (await pathExists(path.join(root, relative))) pass(`root file: ${relative}`);
  else fail(`missing root file: ${relative}`);
}

const expectedSkills = [
  "favstash-shortform",
  "favstash-setup",
  "text-over-broll",
  "talking-head-short",
  "split-screen-short",
  "screen-demo-short",
  "motion-graphics-short",
  "shortform-captions",
  "shortform-sound-design",
  "carousel-maker",
  "shortform-review",
];

for (const skill of expectedSkills) {
  const skillFile = path.join(root, "skills", skill, "SKILL.md");
  const agentFile = path.join(root, "skills", skill, "agents", "openai.yaml");
  if (!(await pathExists(skillFile))) {
    fail(`missing skill: ${skill}`);
    continue;
  }
  const markdown = await fs.readFile(skillFile, "utf8");
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter) fail(`${skill}: missing YAML frontmatter`);
  if (!frontmatter?.[1].includes(`name: ${skill}`)) fail(`${skill}: frontmatter name does not match directory`);
  if (!/^description: ".{30,}"$/m.test(frontmatter?.[1] ?? "")) fail(`${skill}: description is missing, too short, or not quoted`);
  if (/\bTODO\b|\[TODO/.test(markdown)) fail(`${skill}: contains a TODO placeholder`);
  if (!(await pathExists(agentFile))) {
    fail(`${skill}: missing agents/openai.yaml`);
  } else {
    const yaml = await fs.readFile(agentFile, "utf8");
    if (!yaml.includes(`$${skill}`)) fail(`${skill}: default_prompt must explicitly mention $${skill}`);
    if (!yaml.includes("allow_implicit_invocation: true")) fail(`${skill}: implicit invocation policy missing`);
  }
  pass(`skill: ${skill}`);
}

const schemaFiles = (await listFilesRecursively(path.join(root, "schemas"))).filter((file) => file.endsWith(".json"));
if (schemaFiles.length < 6) fail("expected at least six JSON schemas");
for (const schemaFile of schemaFiles) {
  try {
    const schema = await readJson(schemaFile);
    if (!schema.$schema || !schema.title || !schema.type) fail(`${path.basename(schemaFile)}: incomplete schema header`);
    else pass(`schema: ${path.basename(schemaFile)}`);
  } catch (error) {
    fail(`${path.basename(schemaFile)}: invalid JSON (${error.message})`);
  }
}

const manifestPath = path.join(root, "skills", "shortform-sound-design", "assets", "sfx", "manifest.json");
if (!(await pathExists(manifestPath))) {
  fail("missing generated SFX manifest; run npm run generate:sfx");
} else {
  const manifest = await readJson(manifestPath);
  if (manifest.count !== manifest.sounds?.length || manifest.count < 10) fail("SFX manifest count is invalid");
  for (const sound of manifest.sounds ?? []) {
    const asset = path.join(path.dirname(manifestPath), sound.file);
    if (!(await pathExists(asset))) fail(`missing SFX asset: ${sound.file}`);
    else if (await sha256File(asset) !== sound.sha256) fail(`SFX checksum mismatch: ${sound.file}`);
  }
  pass(`SFX pack: ${manifest.count} original sounds`);
}

const runtimeManifestPath = path.join(root, "skills", "favstash-shortform", "runtime-manifest.json");
if (!(await pathExists(runtimeManifestPath))) {
  fail("missing self-contained core runtime; run npm run sync:runtime");
} else {
  const runtimeManifest = await readJson(runtimeManifestPath);
  for (const entry of runtimeManifest.files ?? []) {
    const bundled = path.join(root, "skills", "favstash-shortform", entry.path);
    const source = path.join(root, entry.path);
    if (!(await pathExists(source))) fail(`runtime source is missing: ${entry.path}`);
    else if (await sha256File(source) !== entry.sha256) fail(`runtime bundle is stale: ${entry.path}`);
    if (!(await pathExists(bundled))) fail(`runtime bundle file is missing: ${entry.path}`);
    else if (await sha256File(bundled) !== entry.sha256) fail(`runtime bundle checksum mismatch: ${entry.path}`);
  }
  if (!runtimeManifest.files?.some((entry) => entry.path === "scripts/reference-analyze.mjs")) {
    fail("runtime bundle omits reference-analyze.mjs");
  }
  pass(`self-contained skill runtime: ${runtimeManifest.files?.length ?? 0} files`);
}

const publicFiles = await listFilesRecursively(root);
for (const file of publicFiles) {
  if (file.includes(`${path.sep}.git${path.sep}`) || file.includes(`${path.sep}.dev-private${path.sep}`)) continue;
  const stat = await fs.stat(file);
  if (stat.size > 10 * 1024 * 1024) fail(`unexpected public file over 10 MiB: ${path.relative(root, file)}`);
}

const ignored = spawnSync("git", ["check-ignore", "-q", ".dev-private/README.md"], { cwd: root });
if (ignored.status !== 0) fail(".dev-private is not ignored by Git");
else pass("private development memory is ignored");
const trackedPrivate = spawnSync("git", ["ls-files", ".dev-private"], { cwd: root, encoding: "utf8" });
if (trackedPrivate.stdout.trim()) fail("private development memory is tracked by Git");

if (failures.length) {
  console.error(`Validation failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Validation passed: ${checks.length} checks`);
}
