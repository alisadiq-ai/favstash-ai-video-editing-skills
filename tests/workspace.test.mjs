import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("the main skill works alone, creates edits without setup and preserves creator work", async (context) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "favstash-skill-test-"));
  context.after(async () => fs.rm(temporary, { recursive: true, force: true }));
  // Simulate an installed skill with no repository-root tooling or sibling skills.
  const installed = path.join(temporary, "installed", "favstash-shortform");
  await fs.cp(path.join(root, "skills", "favstash-shortform"), installed, { recursive: true });
  const workspace = path.join(temporary, "creator project");
  const scripts = path.join(installed, "scripts");
  const invoke = (name, args = []) => execFileSync(process.execPath, [
    path.join(scripts, name), "--workspace", workspace, ...args,
  ], { cwd: temporary, encoding: "utf8" }).trim();

  const output = invoke("new-edit.mjs", ["--slug", "A Better Hook"]);
  const studio = path.join(workspace, ".favstash-studio");
  assert.equal(path.dirname(output), path.join(studio, "edits"));
  for (const relative of ["edit.json", "asset-ledger.json", "input", "analysis", "assets", "exports", "previews", "references", "reports", "work"]) {
    await fs.access(path.join(output, relative));
  }
  const original = path.join(output, "input", "take.txt");
  await fs.writeFile(original, "untouched source");
  const another = invoke("new-edit.mjs", ["--slug", "A Better Hook"]);
  assert.notEqual(another, output);
  assert.equal(await fs.readFile(original, "utf8"), "untouched source");

  // Custom project names are supported too, when the metadata is present.
  const resumed = path.join(temporary, "existing edit");
  await fs.rename(output, resumed);
  const reference = spawnSync(process.execPath, [
    path.join(scripts, "reference-analyze.mjs"), "--url", "https://example.com/reference",
    "--edit", resumed, "--reuse-audio",
  ], { cwd: temporary, encoding: "utf8" });
  assert.notEqual(reference.status, 0);
  assert.match(reference.stderr, /analysis-only references cannot be copied/);

  invoke("init-workspace.mjs");
  const preferences = path.join(studio, "preferences.md");
  await fs.appendFile(preferences, "\nCreator marker\n");
  const runtimeFile = path.join(studio, "runtime", "package.json");
  const runtime = JSON.parse(await fs.readFile(runtimeFile, "utf8"));
  assert.equal(runtime.dependencies.hyperframes, "0.8.10");
  runtime.dependencies.hyperframes = "0.8.9";
  runtime.dependencies["creator-package"] = "1.0.0";
  await fs.writeFile(runtimeFile, JSON.stringify(runtime));
  invoke("init-workspace.mjs");
  assert.match(await fs.readFile(preferences, "utf8"), /Creator marker/);
  const retained = JSON.parse(await fs.readFile(runtimeFile, "utf8"));
  assert.equal(retained.dependencies.hyperframes, "0.8.9");
  assert.equal(retained.dependencies["creator-package"], "1.0.0");
  assert.equal(await fs.readFile(path.join(resumed, "input", "take.txt"), "utf8"), "untouched source");

  invoke("index-broll.mjs");
  const index = JSON.parse(await fs.readFile(path.join(studio, "broll-index.v1.json"), "utf8"));
  assert.equal(index.count, 0);
  await fs.access(path.join(installed, "assets", "sfx", "manifest.json"));
});
