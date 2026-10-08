#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { listFilesRecursively, pathExists, readJson, sha256File } from "../skills/3-editing/edit-video/lib/files.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const failures = [];
const expectedSkills = [
  "1-research/find-ideas",
  "2-scripting/write-script",
  "3-editing/edit-video",
  "3-editing-styles/adaptive-glass",
  "3-editing-styles/breakout-card",
  "3-editing-styles/paper-grid",
  "3-editing-styles/text-over-footage",
  "4-publish-and-learn/publish-and-analyze",
];
const skillRoot = path.join(root, "skills");
const discovered = (await listFilesRecursively(skillRoot))
  .filter((file) => path.basename(file) === "SKILL.md")
  .map((file) => path.relative(skillRoot, path.dirname(file))).sort();
if (JSON.stringify(discovered) !== JSON.stringify([...expectedSkills].sort())) {
  failures.push(`Expected ${expectedSkills.length} skills; found: ${discovered.join(", ")}`);
}
for (const skill of discovered) {
  const name = path.basename(skill);
  const markdown = await fs.readFile(path.join(skillRoot, skill, "SKILL.md"), "utf8");
  const frontmatter = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatter?.[1].split("\n").includes(`name: ${name}`)) failures.push(`${skill}: name must match its folder`);
  if (!/^description: ".+"$/m.test(frontmatter?.[1] ?? "")) failures.push(`${skill}: missing description`);
  const agentFile = path.join(skillRoot, skill, "agents", "openai.yaml");
  if (!(await pathExists(agentFile))) failures.push(`${skill}: missing UI metadata`);
  else if (!(await fs.readFile(agentFile, "utf8")).includes(`$${name}`)) {
    failures.push(`${skill}: default prompt must name the skill`);
  }
}

// The Claude plugin manifest must load every skill and release with the package version.
const pluginManifest = await readJson(path.join(root, ".claude-plugin", "plugin.json"));
const manifestSkillDirs = (pluginManifest.skills ?? []).map((dir) => path.resolve(root, dir));
for (const skill of discovered) {
  if (!manifestSkillDirs.includes(path.dirname(path.join(skillRoot, skill)))) {
    failures.push(`.claude-plugin/plugin.json: skills does not load ${skill}`);
  }
}
const packageVersion = (await readJson(path.join(root, "package.json"))).version;
if (pluginManifest.version !== packageVersion) {
  failures.push(`.claude-plugin/plugin.json: version ${pluginManifest.version} must match package.json ${packageVersion}`);
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
    // Skills install one folder each, so a skill's links must stay inside its own folder.
    const owner = discovered.find((skill) => file.startsWith(path.join(skillRoot, skill) + path.sep));
    if (owner && !target.startsWith(path.join(skillRoot, owner) + path.sep)) {
      failures.push(`${relative}: link ${href} leaves the ${path.basename(owner)} skill; name the other skill instead`);
    }
  }
}

const assetRoot = path.join(skillRoot, "3-editing", "edit-video", "assets", "sfx");
const manifest = await readJson(path.join(assetRoot, "manifest.json"));
if (manifest.count !== manifest.sounds?.length) failures.push("Invalid SFX manifest count");
for (const sound of manifest.sounds ?? []) {
  const asset = path.join(assetRoot, sound.file);
  if (!(await pathExists(asset)) || await sha256File(asset) !== sound.sha256) {
    failures.push(`Missing or changed SFX: ${sound.file}`);
  }
}
// Every bundled sound ships to users, so each one must be listed in the manifest.
const listedSounds = new Set((manifest.sounds ?? []).map((sound) => path.join(assetRoot, sound.file)));
for (const file of await listFilesRecursively(assetRoot)) {
  if (file.endsWith(".wav") && !listedSounds.has(file)) failures.push(`SFX not in manifest: ${path.relative(root, file)}`);
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
