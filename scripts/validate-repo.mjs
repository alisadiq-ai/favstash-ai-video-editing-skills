#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { listFilesRecursively, pathExists, readJson, sha256File } from "../skills/favstash-shortform/lib/files.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
const expectedSkills = ["favstash-shortform", "motion-graphics-short", "shortform-captions"];
const skillRoot = path.join(root, "skills");
const discovered = (await listFilesRecursively(skillRoot))
  .filter((file) => path.basename(file) === "SKILL.md")
  .map((file) => path.relative(skillRoot, path.dirname(file))).sort();
if (JSON.stringify(discovered) !== JSON.stringify(expectedSkills)) {
  failures.push(`Expected three skills; found: ${discovered.join(", ")}`);
}
for (const skill of discovered) {
  const markdown = await fs.readFile(path.join(skillRoot, skill, "SKILL.md"), "utf8");
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter?.[1].split("\n").includes(`name: ${skill}`)) failures.push(`${skill}: invalid name`);
  if (!/^description: ".+"$/m.test(frontmatter?.[1] ?? "")) failures.push(`${skill}: missing description`);
  const agentFile = path.join(skillRoot, skill, "agents", "openai.yaml");
  if (!(await pathExists(agentFile))) failures.push(`${skill}: missing UI metadata`);
  else if (!(await fs.readFile(agentFile, "utf8")).includes(`$${skill}`)) {
    failures.push(`${skill}: default prompt must name the skill`);
  }
}

// Check tracked and new public content, excluding local creator work and Git internals.
const inventory = spawnSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { cwd: root, encoding: "utf8" });
if (inventory.status !== 0) throw new Error(inventory.stderr || "Cannot list repository files");
const files = [...new Set(inventory.stdout.split("\0").filter(Boolean))];
for (const relative of files) {
  const file = path.join(root, relative);
  if (!(await pathExists(file))) continue; // Tracked files removed in this change.
  if ((await fs.stat(file)).size > 10 * 1024 * 1024) failures.push(`Unexpected public file over 10 MiB: ${relative}`);
  if (!file.endsWith(".md")) continue;
  const markdown = await fs.readFile(file, "utf8");
  for (const match of markdown.matchAll(/\[[^\]]*\]\(([^\s)]+)\)/g)) {
    const href = match[1];
    if (/^(?:[a-z][a-z\d+.-]*:|#)/i.test(href)) continue;
    const target = path.resolve(path.dirname(file), decodeURIComponent(href.split("#")[0]));
    if (!(await pathExists(target))) failures.push(`${relative}: broken link ${href}`);
  }
}

const assetRoot = path.join(skillRoot, "favstash-shortform", "assets", "sfx");
const manifest = await readJson(path.join(assetRoot, "manifest.json"));
if (manifest.count !== manifest.sounds?.length) failures.push("Invalid SFX manifest count");
for (const sound of manifest.sounds ?? []) {
  const asset = path.join(assetRoot, sound.file);
  if (!(await pathExists(asset)) || await sha256File(asset) !== sound.sha256) {
    failures.push(`Missing or changed SFX: ${sound.file}`);
  }
}
for (const folder of [".dev-private", ".favstash-studio"]) {
  const ignored = spawnSync("git", ["check-ignore", "-q", `${folder}/example`], { cwd: root });
  if (ignored.status !== 0) failures.push(`${folder} is not ignored`);
  if (files.some((file) => file.startsWith(`${folder}/`))) failures.push(`${folder} contains tracked private files`);
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Validated ${discovered.length} skills, local Markdown links, SFX checksums and private-file exclusions.`);
}
