import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));

test("workspace setup is repeatable and edit runs are isolated", async (context) => {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), "favstash-studio-test-"));
  context.after(async () => fs.rm(temporary, { recursive: true, force: true }));

  const init = path.join(root, "scripts", "init-workspace.mjs");
  execFileSync(process.execPath, [init, "--workspace", temporary], { encoding: "utf8" });
  const studio = path.join(temporary, ".favstash-studio");
  const preferences = path.join(studio, "preferences.md");
  assert.match(await fs.readFile(preferences, "utf8"), /# Creator preferences/);

  await fs.appendFile(preferences, "\nCreator marker\n");
  execFileSync(process.execPath, [init, "--workspace", temporary], { encoding: "utf8" });
  assert.match(await fs.readFile(preferences, "utf8"), /Creator marker/);

  const runtimePackage = JSON.parse(await fs.readFile(path.join(studio, "runtime", "package.json"), "utf8"));
  assert.equal(runtimePackage.dependencies.hyperframes, "0.8.10");

  const create = path.join(root, "scripts", "new-edit.mjs");
  const output = execFileSync(process.execPath, [
    create,
    "--workspace", temporary,
    "--slug", "A Better Hook",
    "--style", "text-over-broll",
    "--source-mode", "fresh",
  ], { encoding: "utf8" }).trim();

  assert.match(path.basename(output), /^\d{4}-\d{2}-\d{2}-\d{6}-a-better-hook-[a-f0-9]{6}$/);
  assert.equal(path.dirname(output), path.join(studio, "edits"));
  for (const relative of ["edit.json", "edit-plan.json", "asset-ledger.json", "analysis", "assets", "exports", "previews", "references", "reports", "work"]) {
    await fs.access(path.join(output, relative));
  }

  const reference = spawnSync(process.execPath, [
    path.join(root, "scripts", "reference-analyze.mjs"),
    "--url", "https://example.com/reference",
    "--edit", output,
    "--reuse-audio",
  ], { encoding: "utf8" });
  assert.notEqual(reference.status, 0);
  assert.match(reference.stderr, /analysis-only references cannot be copied/);

  const remotion = path.join(root, "scripts", "enable-remotion.mjs");
  const unacknowledged = spawnSync(process.execPath, [remotion, "--workspace", temporary, "--no-install"], { encoding: "utf8" });
  assert.equal(unacknowledged.status, 2);
  assert.match(unacknowledged.stderr, /special license/);
  execFileSync(process.execPath, [remotion, "--workspace", temporary, "--acknowledge-license", "--no-install"], { encoding: "utf8" });
  const optedInPackage = JSON.parse(await fs.readFile(path.join(studio, "runtime", "package.json"), "utf8"));
  assert.equal(optedInPackage.dependencies.remotion, "4.0.515");
  await fs.access(path.join(studio, "runtime", "remotion-license-acknowledgment.json"));
});
