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

test("one-camera builds its demo when installed alone", async (context) => {
  const installed = await installAlone(context, "one-camera");
  const work = await fs.mkdtemp(path.join(os.tmpdir(), "favstash-one-camera-"));
  context.after(async () => fs.rm(work, { recursive: true, force: true }));
  const gsap = path.join(work, "gsap.min.js");
  await fs.writeFile(gsap, "/* stand-in for GSAP */\n");
  const output = path.join(work, "demo");
  const result = spawnSync(process.execPath, [path.join(installed, "scripts", "example-build.mjs"), output, "--gsap", gsap], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout.split("\n")[0]);
  assert.equal(summary.frames, 960);

  const page = await fs.readFile(path.join(output, "index.html"), "utf8");
  assert.match(page, /data-composition-id="main"/);
  assert.match(page, /window\.__timelines\.main=tl/);
  assert.doesNotMatch(page, /__FILL__|__MEDIA__/);
  // Font stacks carry quotes, so tokens must live in a style block, not an inline style attribute.
  assert.match(page, /<style>#root\{[^<]*--sans:"Helvetica Neue"/);
  assert.doesNotMatch(page, /style="--/);
  for (const file of ["style.css", "assets/gsap.min.js", "hyperframes.json", "media-manifest.json"]) await fs.access(path.join(output, file));

  const cues = JSON.parse(await fs.readFile(path.join(output, "cues.json"), "utf8"));
  assert.equal(cues.fps, 30);
  assert.ok(cues.cues.length > 40);
  for (const [index, cue] of cues.cues.entries()) {
    assert.ok(Number.isInteger(cue.frame) && cue.frame >= 0 && cue.frame <= 960, JSON.stringify(cue));
    assert.ok(cue.t <= cue.frame / 30, `cue time ${cue.t} must not round past frame ${cue.frame}`);
    if (index) assert.ok(cue.frame >= cues.cues[index - 1].frame, "cues are sorted");
  }

  const again = spawnSync(process.execPath, [path.join(installed, "scripts", "example-build.mjs"), output, "--gsap", gsap], { encoding: "utf8" });
  assert.notEqual(again.status, 0, "a revision is never overwritten");
});

test("one-camera guards its camera and ids", async (context) => {
  const installed = await installAlone(context, "one-camera");
  const { Reel } = await import(pathToFileURL(path.join(installed, "lib", "one-camera.mjs")).href);
  const reel = new Reel({ output: path.join(os.tmpdir(), "unused"), total: 300 });
  reel.camera(0, 1, { scale: 0.5 });
  assert.throws(() => reel.camera(20, 1, { scale: 1 }), /must not overlap/);
  assert.throws(() => reel.cameraAt(10), /inside a camera move/);
  assert.deepEqual(reel.toScreen({ x: 540, y: 960 }, 40), { x: 540, y: 960, s: 0.5 });
  reel.claim("hook");
  assert.throws(() => reel.claim("hook"), /Duplicate id/);
  assert.throws(() => reel.claim("Hook"), /lowercase id/);
  // A frame time rounded up would fire a set() one frame late.
  for (let frame = 0; frame < 300; frame += 1) assert.ok(reel.T(frame) <= frame / 30 && frame / 30 - reel.T(frame) < 0.0002);
  assert.throws(() => new Reel({ output: "x", total: 300, fps: 25 }), /30 fps/);
});
