import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const styles = path.join(root, "skills", "3-editing-styles");

// Skills install one folder each, so every style has to work without its siblings.
async function installAlone(context, name) {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), `favstash-style-${name}-`));
  context.after(async () => fs.rm(temporary, { recursive: true, force: true }));
  const installed = path.join(temporary, name);
  await fs.cp(path.join(styles, name), installed, { recursive: true });
  return installed;
}

test("adaptive-glass works when installed alone", async (context) => {
  const installed = await installAlone(context, "adaptive-glass");
  const glass = await import(pathToFileURL(path.join(installed, "lib", "glass.mjs")).href);
  await fs.access(path.join(glass.GLASS_ASSETS, "palettes.json"));
  await fs.access(path.join(glass.GLASS_ASSETS, "glass.css"));
  const help = execFileSync(process.execPath, [path.join(installed, "scripts", "scaffold-glass.mjs"), "--help"], { encoding: "utf8" });
  assert.match(help, /scaffold-glass\.mjs/);
});

const python = spawnSync("python3", ["--version"]).status === 0;

for (const [name, module] of [["paper-grid", "paper_grid"], ["breakout-card", "breakout"]]) {
  test(`${name} builder imports when installed alone`, { skip: !python && "python3 not available" }, async (context) => {
    const installed = await installAlone(context, name);
    const result = spawnSync("python3", ["-B", "-c",
      `import sys; sys.path.insert(0, ${JSON.stringify(path.join(installed, "scripts"))}); import ${module}; print(${module}.find_gsap.__name__)`],
    { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /find_gsap/);
  });
}

test("breakout-card bundles its font license", async () => {
  const fonts = await fs.readdir(path.join(styles, "breakout-card", "assets", "fonts"));
  assert.ok(fonts.includes("OFL.txt"));
  assert.ok(fonts.filter((file) => file.endsWith(".ttf")).length >= 4);
});
